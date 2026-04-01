/* global describe, it, expect, beforeEach, jest */
const pool = require('../../../config/db');
const invoiceModel = require('../invoices.model');

jest.mock('../../../config/db');
jest.mock('../../sellers/sellers.model', () => ({
  getSellerById: jest.fn(),
}));
jest.mock('../invoiceAttachments.model', () => ({
  saveAttachment: jest.fn(),
  cleanupAttachments: jest.fn(),
}));
jest.mock('../../../services', () => ({
  list: jest.fn().mockResolvedValue([]),
  delete: jest.fn().mockResolvedValue(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retourne un mock conn.query qui gère les cas les plus courants de createInvoice.
 * On peut passer des overrides pour personnaliser certains comportements.
 */
function makeCreateConnMock(overrides = {}) {
  return jest.fn().mockImplementation((sql) => {
    if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
      return Promise.resolve();
    }
    if (overrides[sql]) return overrides[sql]();

    // Seller lookup
    if (sql.includes('FROM') && sql.includes('sellers')) {
      return Promise.resolve({ rows: [{ legal_name: 'Acme Corp' }] });
    }
    // Vérification doublon
    if (sql.includes('SELECT id') && sql.includes('invoices')) {
      return Promise.resolve({ rows: [] });
    }
    // Insertion facture
    if (sql.includes('INSERT INTO') && sql.includes('invoices')) {
      return Promise.resolve({ rows: [{ id: 1 }] });
    }
    // Upsert séquence
    if (sql.includes('invoice_sequence')) {
      return Promise.resolve({ rows: [{ last_sequence: 1 }] });
    }
    // UPDATE invoice_sequence_number
    if (sql.includes('SET invoice_sequence_number')) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  });
}

/**
 * Prépare pool.query pour simuler getInvoiceById après une transaction.
 */
function mockGetInvoiceById(invoice, extras = {}) {
  const { getSellerById } = require('../../sellers/sellers.model');
  getSellerById.mockResolvedValue(extras.seller || { id: invoice.seller_id || 1 });

  pool.query
    .mockResolvedValueOnce({ rows: [invoice] })           // SELECT * FROM invoices
    .mockResolvedValueOnce({ rows: extras.lines || [] })  // invoice_lines
    .mockResolvedValueOnce({ rows: extras.taxes || [] })  // invoice_taxes
    .mockResolvedValueOnce({ rows: extras.attachments || [] }) // invoice_attachments
    .mockResolvedValueOnce({ rows: extras.client ? [extras.client] : [] }); // invoice_client
}

// ---------------------------------------------------------------------------

describe('invoice.model', () => {
  let conn;

  beforeEach(() => {
    jest.clearAllMocks();

    conn = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(conn);
  });

  // =========================================================================
  // createInvoice
  // =========================================================================
  describe('createInvoice', () => {
    const baseInvoice = {
      id: 1,
      invoice_number: 'INV-001',
      issue_date: '2024-01-01',
      fiscal_year: 2024,
      seller_id: 1,
      seller_legal_name: 'Acme Corp',
      invoice_type: 'invoice',
    };
    const baseClient = { client_legal_name: 'Client Test', client_address: '123 Rue Exemple' };
    const mainAttachment = [{ attachment_type: 'main', filename: 'facture.pdf' }];

    it('crée une facture avec succès', async () => {
      conn.query = makeCreateConnMock();
      mockGetInvoiceById(baseInvoice, { client: baseClient });

      const { saveAttachment, cleanupAttachments } = require('../invoiceAttachments.model');
      saveAttachment.mockResolvedValue();
      cleanupAttachments.mockResolvedValue();

      const result = await invoiceModel.createInvoice({
        invoice: { ...baseInvoice },
        client: baseClient,
        attachments: mainAttachment,
        lines: [{ description: 'Service A', amount: 100 }],
        taxes: [{ description: 'TVA', amount: 20 }],
      });

      expect(conn.query).toHaveBeenCalledWith('BEGIN');
      expect(conn.query).toHaveBeenCalledWith('COMMIT');
      expect(conn.release).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.invoice_number).toBe('INV-001');
    });

    it('attribue un invoice_sequence_number pour les factures non-devis', async () => {
      conn.query = makeCreateConnMock();
      mockGetInvoiceById({ ...baseInvoice, invoice_sequence_number: 3 });

      const { saveAttachment, cleanupAttachments } = require('../invoiceAttachments.model');
      saveAttachment.mockResolvedValue();
      cleanupAttachments.mockResolvedValue();

      // Surcharge le mock séquence pour renvoyer 3
      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) return Promise.resolve();
        if (sql.includes('FROM') && sql.includes('sellers')) return Promise.resolve({ rows: [{ legal_name: 'Acme Corp' }] });
        if (sql.includes('SELECT id') && sql.includes('invoices')) return Promise.resolve({ rows: [] });
        if (sql.includes('INSERT INTO') && sql.includes('invoices')) return Promise.resolve({ rows: [{ id: 1 }] });
        if (sql.includes('invoice_sequence')) return Promise.resolve({ rows: [{ last_sequence: 3 }] });
        if (sql.includes('SET invoice_sequence_number')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });

      await invoiceModel.createInvoice({
        invoice: { ...baseInvoice },
        client: baseClient,
        attachments: mainAttachment,
      });

      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('invoice_sequence'),
        [1]
      );
      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('SET invoice_sequence_number'),
        [3, 1]
      );
    });

    it("l'upsert séquence utilise ON CONFLICT pour être atomique", async () => {
      conn.query = makeCreateConnMock();
      mockGetInvoiceById(baseInvoice);

      const { saveAttachment, cleanupAttachments } = require('../invoiceAttachments.model');
      saveAttachment.mockResolvedValue();
      cleanupAttachments.mockResolvedValue();

      await invoiceModel.createInvoice({
        invoice: { ...baseInvoice },
        client: baseClient,
        attachments: mainAttachment,
      });

      const seqCall = conn.query.mock.calls.find(([sql]) => sql.includes('invoice_sequence'));
      expect(seqCall).toBeDefined();
      expect(seqCall[0]).toContain('ON CONFLICT');
      expect(seqCall[0]).toContain('DO UPDATE');
    });

    it("ne crée pas de séquence pour un devis (invoice_type = 'quote')", async () => {
      conn.query = makeCreateConnMock();
      mockGetInvoiceById({ ...baseInvoice, invoice_type: 'quote' });

      const { saveAttachment, cleanupAttachments } = require('../invoiceAttachments.model');
      saveAttachment.mockResolvedValue();
      cleanupAttachments.mockResolvedValue();

      await invoiceModel.createInvoice({
        invoice: { ...baseInvoice, invoice_type: 'quote' },
        client: baseClient,
        attachments: mainAttachment,
      });

      const seqCall = conn.query.mock.calls.find(([sql]) => sql.includes('invoice_sequence'));
      expect(seqCall).toBeUndefined();
    });

    it('rollback si invoice_number manquant', async () => {
      conn.query.mockResolvedValue();

      await expect(
        invoiceModel.createInvoice({
          invoice: { issue_date: '2024-01-01' },
          attachments: [{ attachment_type: 'main' }],
        })
      ).rejects.toThrow('invoice_number obligatoire');

      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });

    it('rollback si doublon facture', async () => {
      conn.query
        .mockResolvedValueOnce()                          // BEGIN
        .mockResolvedValueOnce({ rows: [] })              // seller lookup
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });   // doublon trouvé

      await expect(
        invoiceModel.createInvoice({
          invoice: {
            invoice_number: 'INV-001',
            issue_date: '2024-01-01',
            seller_id: 1,
            fiscal_year: 2024,
          },
          attachments: [{ attachment_type: 'main' }],
        })
      ).rejects.toThrow(/existe déjà/);

      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });

    it('rollback si plusieurs attachments main', async () => {
      conn.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({ rows: [] })    // seller lookup
        .mockResolvedValueOnce({ rows: [] });   // pas de doublon

      await expect(
        invoiceModel.createInvoice({
          invoice: {
            invoice_number: 'INV-002',
            issue_date: '2024-01-01',
            seller_id: 1,
            fiscal_year: 2024,
          },
          attachments: [
            { attachment_type: 'main' },
            { attachment_type: 'main' },
          ],
        })
      ).rejects.toThrow('justificatif principal');

      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });

    it('rollback si l\'upsert séquence échoue', async () => {
      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN')) return Promise.resolve();
        if (sql.includes('FROM') && sql.includes('sellers')) return Promise.resolve({ rows: [{ legal_name: 'Acme Corp' }] });
        if (sql.includes('SELECT id') && sql.includes('invoices')) return Promise.resolve({ rows: [] });
        if (sql.includes('INSERT INTO') && sql.includes('invoices')) return Promise.resolve({ rows: [{ id: 1 }] });
        if (sql.includes('invoice_sequence')) return Promise.reject(new Error('sequence error'));
        return Promise.resolve({ rows: [] });
      });

      await expect(
        invoiceModel.createInvoice({
          invoice: {
            invoice_number: 'INV-003',
            issue_date: '2024-01-01',
            seller_id: 1,
            fiscal_year: 2024,
            invoice_type: 'invoice',
          },
          attachments: [{ attachment_type: 'main' }],
        })
      ).rejects.toThrow('sequence error');

      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // deleteInvoice
  // =========================================================================
  describe('deleteInvoice', () => {
    it('retourne null si la facture n\'est pas en draft', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await invoiceModel.deleteInvoice(1);
      expect(result).toBeNull();
    });

    it('passe la facture en cancelled', async () => {
      const fakeRow = { id: 1, status: 'cancelled' };
      pool.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await invoiceModel.deleteInvoice(1, 'Erreur test');

      expect(result).toEqual(fakeRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE invoicing.invoices'),
        [1, 'Erreur test']
      );
    });

    it('passe en cancelled sans raison (null par défaut)', async () => {
      const fakeRow = { id: 2, status: 'cancelled' };
      pool.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await invoiceModel.deleteInvoice(2);

      expect(result).toEqual(fakeRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
        [2, null]
      );
    });
  });

  // =========================================================================
  // updateInvoice
  // =========================================================================
  describe('updateInvoice', () => {
    it('rollback si erreur', async () => {
      conn.query.mockRejectedValueOnce(new Error('Fail update'));

      await expect(invoiceModel.updateInvoice(1, {})).rejects.toThrow('Fail update');

      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });

    it('met à jour facture, client, lignes et taxes', async () => {
      const fakeUpdatedInvoice = { id: 1, invoice_number: 'INV-UPD' };
      const { getSellerById } = require('../../sellers/sellers.model');
      getSellerById.mockResolvedValue({ id: 1 });

      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT')) return Promise.resolve();
        if (sql.includes('UPDATE') && sql.includes('invoices')) return Promise.resolve({ rows: [] });
        if (sql.includes('SELECT id FROM') && sql.includes('invoice_client')) return Promise.resolve({ rows: [{ id: 99 }] });
        if (sql.includes('UPDATE') && sql.includes('invoice_client')) return Promise.resolve({ rows: [] });
        if (sql.includes('DELETE FROM')) return Promise.resolve();
        if (sql.includes('SELECT id, stored_name')) return Promise.resolve({ rows: [] });
        if (sql.includes('SELECT stored_name')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });

      mockGetInvoiceById(fakeUpdatedInvoice);

      const { saveAttachment } = require('../invoiceAttachments.model');
      saveAttachment.mockResolvedValue();

      const result = await invoiceModel.updateInvoice(1, {
        invoice: { invoice_number: 'INV-UPD' },
        client: { client_legal_name: 'ACME', client_siret: '12345' },
        lines: [{ description: 'Ligne 1', amount: 100 }],
        taxes: [{ description: 'TVA', amount: 20 }],
        newAttachments: [],
        existingAttachments: [],
      });

      expect(conn.query).toHaveBeenCalledWith('COMMIT');
      expect(result.invoice_number).toBe('INV-UPD');
    });

    it('supprime les attachments non conservés par le front', async () => {
      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT')) return Promise.resolve();
        if (sql.includes('SELECT id, stored_name')) return Promise.resolve({ rows: [{ id: 5, stored_name: 'old.pdf' }] });
        if (sql.includes('DELETE FROM') && sql.includes('invoice_attachments')) return Promise.resolve();
        if (sql.includes('SELECT stored_name')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });

      const { getSellerById } = require('../../sellers/sellers.model');
      getSellerById.mockResolvedValue(null);

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValue({ rows: [] });

      await invoiceModel.updateInvoice(1, {
        existingAttachments: [], // le front ne garde rien → old.pdf doit être supprimé
      });

      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        [5]
      );
    });

    it('conserve les attachments présents dans existingAttachments', async () => {
      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT')) return Promise.resolve();
        if (sql.includes('SELECT id, stored_name')) {
          return Promise.resolve({ rows: [{ id: 5, stored_name: 'keep.pdf' }, { id: 6, stored_name: 'remove.pdf' }] });
        }
        if (sql.includes('DELETE FROM') && sql.includes('invoice_attachments')) return Promise.resolve();
        if (sql.includes('SELECT stored_name')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });

      const { getSellerById } = require('../../sellers/sellers.model');
      getSellerById.mockResolvedValue(null);
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValue({ rows: [] });

      await invoiceModel.updateInvoice(1, {
        existingAttachments: [{ id: 5 }], // on garde id 5, on supprime id 6
      });

      // Seul l'id 6 doit être supprimé
      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        [6]
      );
      const deleteCallsWith5 = conn.query.mock.calls.filter(
        ([sql, params]) => sql.includes('DELETE FROM') && params?.[0] === 5
      );
      expect(deleteCallsWith5).toHaveLength(0);
    });
  });

  // =========================================================================
  // getAllInvoices
  // =========================================================================
  describe('getAllInvoices', () => {
    it('retourne [] si aucune facture', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await invoiceModel.getAllInvoices();
      expect(result).toEqual([]);
    });

    it('assemble lignes, taxes et attachments par facture', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
        .mockResolvedValueOnce({ rows: [{ invoice_id: 1, description: 'L1' }] }) // lines
        .mockResolvedValueOnce({ rows: [{ invoice_id: 2, description: 'T1' }] }) // taxes
        .mockResolvedValueOnce({ rows: [] });                                      // attachments

      const result = await invoiceModel.getAllInvoices();

      expect(result).toHaveLength(2);
      expect(result[0].lines).toHaveLength(1);
      expect(result[1].taxes).toHaveLength(1);
      expect(result[0].attachments).toEqual([]);
    });

    it('retourne des tableaux vides pour les relations manquantes', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 99 }] })
        .mockResolvedValueOnce({ rows: [] }) // lines
        .mockResolvedValueOnce({ rows: [] }) // taxes
        .mockResolvedValueOnce({ rows: [] }); // attachments

      const [invoice] = await invoiceModel.getAllInvoices();
      expect(invoice.lines).toEqual([]);
      expect(invoice.taxes).toEqual([]);
      expect(invoice.attachments).toEqual([]);
    });
  });

  // =========================================================================
  // getDepositInvoices
  // =========================================================================
  describe('getDepositInvoices', () => {
    it('throw si seller manquant', async () => {
      await expect(invoiceModel.getDepositInvoices(null)).rejects.toThrow('Seller is required');
    });

    it('throw si seller sans id', async () => {
      await expect(invoiceModel.getDepositInvoices({})).rejects.toThrow('Seller is required');
    });

    it('retourne les factures deposit sans filtre client', async () => {
      const fakeRows = [{ id: 1, invoice_number: 'DEP-001' }];
      pool.query.mockResolvedValueOnce({ rows: fakeRows });

      const result = await invoiceModel.getDepositInvoices({ id: 42 });

      expect(result).toEqual(fakeRows);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("invoice_type = 'deposit'"),
        [42]
      );
    });

    it('filtre par client si clientId fourni', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await invoiceModel.getDepositInvoices({ id: 42 }, 99);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('client_id'),
        [42, 99]
      );
    });

    it('exclut les factures déjà utilisées comme acompte', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await invoiceModel.getDepositInvoices({ id: 1 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
        expect.anything()
      );
    });
  });

  // =========================================================================
  // getInvoicesBySeller
  // =========================================================================
  describe('getInvoicesBySeller', () => {
    it('retourne les factures avec le client imbriqué', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          seller_id: 5,
          seller_plan: 'pro',
          client_id: 10,
          client_is_company: true,
          client_legal_name: 'ACME',
          client_siret: '12345',
          client_vat_number: null,
          client_address: '1 rue Test',
          client_city: 'Paris',
          client_postal_code: '75001',
          client_country_code: 'FR',
          client_email: 'acme@test.com',
          client_phone: null,
          client_firstname: null,
          client_lastname: null,
        }],
      });

      const result = await invoiceModel.getInvoicesBySeller(5);

      expect(result).toHaveLength(1);
      expect(result[0].client.legal_name).toBe('ACME');
      expect(result[0].client.id).toBe(10);
      expect(result[0].plan).toBe('pro');
    });

    it('retourne [] si aucune facture pour ce vendeur', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await invoiceModel.getInvoicesBySeller(999);
      expect(result).toEqual([]);
    });

    it('imbrique toutes les propriétés client correctement', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 2,
          seller_id: 1,
          seller_plan: 'basic',
          client_id: 20,
          client_is_company: false,
          client_firstname: 'Jean',
          client_lastname: 'Dupont',
          client_legal_name: null,
          client_siret: null,
          client_vat_number: null,
          client_address: null,
          client_city: null,
          client_postal_code: null,
          client_country_code: 'FR',
          client_email: null,
          client_phone: '0600000000',
        }],
      });

      const [invoice] = await invoiceModel.getInvoicesBySeller(1);

      expect(invoice.client.firstname).toBe('Jean');
      expect(invoice.client.lastname).toBe('Dupont');
      expect(invoice.client.is_company).toBe(false);
      expect(invoice.client.phone).toBe('0600000000');
    });
  });
});