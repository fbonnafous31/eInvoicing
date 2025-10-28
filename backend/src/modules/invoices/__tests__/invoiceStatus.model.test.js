/* global describe, it, expect, beforeEach, jest */
const pool = require('../../../config/db');
const {
  updateTechnicalStatus,
  updateBusinessStatus,
  getInvoiceStatusHistory,
  getInvoiceStatusComment
} = require('../invoiceStatus.model');

jest.mock('../../../config/db', () => ({
  query: jest.fn(),
}));

describe('status.model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTechnicalStatus', () => {
    it('met à jour le statut technique et retourne la facture', async () => {
      const fakeInvoice = { id: 1, technical_status: 'ok', submission_id: 'abc' };
      pool.query.mockResolvedValue({ rows: [fakeInvoice] });

      const result = await updateTechnicalStatus(1, { technicalStatus: 'ok', submissionId: 'abc' });

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['ok', 'abc', 1]);
      expect(result).toEqual(fakeInvoice);
    });
  });

  describe('updateBusinessStatus', () => {
    it('met à jour le statut métier et insère dans l’historique', async () => {
      const updatedInvoice = { id: 1, business_status: 'paid' };
      pool.query
        .mockResolvedValueOnce({ rows: [updatedInvoice] })  // update invoice
        .mockResolvedValueOnce({ rows: [{ id: 10 }] });     // insert history

      const result = await updateBusinessStatus(1, { statusCode: 'paid', statusLabel: 'Payée', clientComment: 'Merci' });

      // Vérifie l'update de la facture
      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE invoicing.invoices'),
        ['paid', 1]
      );

      // Vérifie l'insertion dans l'historique
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO invoicing.invoice_status'),
        [1, 'paid', 'Payée', 'Merci']
      );

      expect(result).toEqual(updatedInvoice);
    });

    it('met à jour sans commentaire client', async () => {
      const updatedInvoice = { id: 2, business_status: 'draft' };
      pool.query
        .mockResolvedValueOnce({ rows: [updatedInvoice] })
        .mockResolvedValueOnce({ rows: [{ id: 11 }] });

      const result = await updateBusinessStatus(2, { statusCode: 'draft', statusLabel: 'Brouillon' });

      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO invoicing.invoice_status'),
        [2, 'draft', 'Brouillon', null]
      );
      expect(result).toEqual(updatedInvoice);
    });
  });

  describe('getInvoiceStatusHistory', () => {
    it('retourne l’historique des statuts', async () => {
      const rows = [
        { id: 1, status_code: 'draft', status_label: 'Brouillon', client_comment: null, created_at: '2025-01-01' },
        { id: 2, status_code: 'paid', status_label: 'Payée', client_comment: 'Merci', created_at: '2025-01-02' },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await getInvoiceStatusHistory(1);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(result).toEqual(rows);
    });
  });

  describe('getInvoiceStatusComment', () => {
    it('retourne le dernier commentaire pour un statut', async () => {
      const rows = [{ client_comment: 'Merci' }];
      pool.query.mockResolvedValue({ rows });

      const result = await getInvoiceStatusComment(1, 'paid');
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, 'paid']);
      expect(result).toBe('Merci');
    });

    it('retourne null si pas de commentaire', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getInvoiceStatusComment(1, 'draft');
      expect(result).toBeNull();
    });
  });
});
