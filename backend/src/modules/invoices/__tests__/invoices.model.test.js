/* global describe, it, expect, beforeEach, afterEach, jest */
const fs = require('fs');
const path = require('path');
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

describe('invoice.model', () => {
  let conn;
  let getInvoiceByIdMock;
  const uploadDir = path.join(__dirname, '../../../uploads/invoices');

  beforeEach(() => {
    jest.clearAllMocks();

    conn = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValue(conn);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (getInvoiceByIdMock) {
      getInvoiceByIdMock.mockRestore();
      getInvoiceByIdMock = undefined;
    }
  });

  // ------------------- createInvoice -------------------
  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const fakeInvoice = {
        id: 1,
        invoice_number: 'INV-001',
        issue_date: '2024-01-01',
        fiscal_year: 2024,
        seller_id: 1,
        seller_legal_name: 'Acme Corp',
      };

      const fakeClient = {
        client_legal_name: 'Client Test',
        client_address: '123 Rue Exemple',
      };

      const attachments = [{ attachment_type: 'main', filename: 'facture.pdf' }];
      const lines = [{ description: 'Service A', amount: 100 }];
      const taxes = [{ description: 'TVA', amount: 20 }];

      // Mock de conn.query (transaction interne)
      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
          return Promise.resolve();
        }
        // Seller lookup
        if (sql.includes('FROM') && sql.includes('sellers')) {
          return Promise.resolve({ rows: [{ legal_name: 'Acme Corp' }] });
        }
        // Vérification doublon
        if (sql.includes('SELECT id') && sql.includes('invoices')) {
          return Promise.resolve({ rows: [] });
        }
        // Insertion facture → DOIT retourner l'id
        if (sql.includes('INSERT INTO') && sql.includes('invoices')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        // Tout le reste (INSERT client, lines, taxes, etc.)
        return Promise.resolve({ rows: [] });
      });

      // Mock de pool.query pour getInvoiceById (appelé APRÈS la transaction)
      const { getSellerById } = require('../../sellers/sellers.model');
      getSellerById.mockResolvedValue({ id: 1, legal_name: 'Acme Corp' });

      pool.query
        .mockResolvedValueOnce({ rows: [fakeInvoice] })   // SELECT * FROM invoices WHERE id
        .mockResolvedValueOnce({ rows: lines })             // invoice_lines
        .mockResolvedValueOnce({ rows: taxes })             // invoice_taxes  
        .mockResolvedValueOnce({ rows: attachments })       // invoice_attachments
        .mockResolvedValueOnce({ rows: [fakeClient] });     // invoice_client

      const { saveAttachment, cleanupAttachments } = require('../invoiceAttachments.model');
      saveAttachment.mockResolvedValue();
      cleanupAttachments.mockResolvedValue();

      const result = await invoiceModel.createInvoice({
        invoice: fakeInvoice,
        client: fakeClient,
        attachments,
        lines,
        taxes,
      });

      expect(conn.query).toHaveBeenCalledWith('BEGIN');
      expect(conn.query).toHaveBeenCalledWith('COMMIT');
      expect(conn.release).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.invoice_number).toBe('INV-001');
    });
    
    it('rollback si invoice_number manquant', async () => {
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
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // seller lookup
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // existing invoice

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
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // seller lookup
        .mockResolvedValueOnce({ rows: [] }); // no duplicate

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
  });

  // ------------------- deleteInvoice -------------------
  describe('deleteInvoice', () => {
    it('retourne null si facture non draft', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await invoiceModel.deleteInvoice(1);

      expect(result).toBeNull();
    });

    it('met à jour la facture en cancelled', async () => {
      const fakeRow = { id: 1, status: 'cancelled' };

      pool.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await invoiceModel.deleteInvoice(1, 'Erreur test');

      expect(result).toEqual(fakeRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE invoices'),
        [1, 'Erreur test']
      );
    });
  });

  // ------------------- updateInvoice -------------------
  describe('updateInvoice', () => {
    beforeEach(() => {
      pool.query.mockImplementation((sql, params) => {
        if (sql.includes('FROM invoicing.invoices WHERE id = $1')) {
          return Promise.resolve({
            rows: [{ id: params[0], invoice_number: 'INV-002', seller_id: 1 }],
          });
        }

        if (
          sql.includes('invoice_lines') ||
          sql.includes('invoice_taxes') ||
          sql.includes('invoice_attachments') ||
          sql.includes('invoice_client')
        ) {
          return Promise.resolve({ rows: [] });
        }

        return Promise.resolve({ rows: [{ id: 1 }] });
      });
    });

    it('rollback si erreur', async () => {
      const error = new Error('Fail update');
      conn.query.mockRejectedValueOnce(error);

      await expect(invoiceModel.updateInvoice(1, {})).rejects.toThrow('Fail update');

      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });
  });

  // ------------------- getAllInvoices -------------------
  describe('getAllInvoices', () => {
    it('retourne [] si aucune facture', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await invoiceModel.getAllInvoices();
      expect(result).toEqual([]);
    });

    it('assemble lignes, taxes et attachments par facture', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }) // invoices
        .mockResolvedValueOnce({ rows: [{ invoice_id: 1, description: 'L1' }] }) // lines
        .mockResolvedValueOnce({ rows: [{ invoice_id: 2, description: 'T1' }] }) // taxes
        .mockResolvedValueOnce({ rows: [] }); // attachments

      const result = await invoiceModel.getAllInvoices();
      expect(result).toHaveLength(2);
      expect(result[0].lines).toHaveLength(1);
      expect(result[1].taxes).toHaveLength(1);
      expect(result[0].attachments).toEqual([]);
    });
  });

  // ------------------- getDepositInvoices -------------------
  describe('getDepositInvoices', () => {
    it('throw si seller manquant', async () => {
      await expect(invoiceModel.getDepositInvoices(null)).rejects.toThrow('Seller is required');
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
  });

  // ------------------- getInvoicesBySeller -------------------
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
        }]
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
  });

  // ------------------- updateInvoice (complet) -------------------
  describe('updateInvoice', () => {
    // Le test rollback existe déjà, on ajoute le happy path

    it('met à jour facture, client, lignes et taxes', async () => {
      const fakeUpdatedInvoice = { id: 1, invoice_number: 'INV-UPD' };
      const { getSellerById } = require('../../sellers/sellers.model');
      getSellerById.mockResolvedValue({ id: 1 });

      conn.query.mockImplementation((sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT')) return Promise.resolve();
        if (sql.includes('UPDATE') && sql.includes('invoices')) return Promise.resolve({ rows: [] });
        if (sql.includes('UPDATE') && sql.includes('invoice_client')) return Promise.resolve({ rows: [] });
        if (sql.includes('SELECT id FROM') && sql.includes('invoice_client')) return Promise.resolve({ rows: [{ id: 99 }] });
        if (sql.includes('DELETE FROM') && sql.includes('invoice_lines')) return Promise.resolve();
        if (sql.includes('DELETE FROM') && sql.includes('invoice_taxes')) return Promise.resolve();
        if (sql.includes('SELECT id, stored_name')) return Promise.resolve({ rows: [] });
        if (sql.includes('SELECT stored_name')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });

      // pool.query pour getInvoiceById final
      pool.query
        .mockResolvedValueOnce({ rows: [fakeUpdatedInvoice] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

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

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValue({ rows: [] });

      const { getSellerById } = require('../../sellers/sellers.model');
      getSellerById.mockResolvedValue(null);

      await invoiceModel.updateInvoice(1, {
        existingAttachments: [], // le front ne garde rien → old.pdf doit être supprimé
      });

      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        [5]
      );
    });
  });
});