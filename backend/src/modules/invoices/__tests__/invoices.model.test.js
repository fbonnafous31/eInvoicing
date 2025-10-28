/* global describe, it, expect, beforeEach, afterEach, jest */
const pool = require('../../../config/db');
const invoiceModel = require('../invoices.model');
const { saveAttachment } = require('../invoiceAttachments.model');

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

  beforeEach(() => {
    jest.clearAllMocks();
    conn = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(conn);
  });

  afterEach(() => {
    if (getInvoiceByIdMock) {
      getInvoiceByIdMock.mockRestore();
      getInvoiceByIdMock = undefined;
    }
  });

  // ------------------- updateInvoice -------------------
  describe('updateInvoice', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      pool.query.mockImplementation((sql, params) => {
        if (sql.includes('FROM invoicing.invoices WHERE id = $1')) {
          return Promise.resolve({ rows: [{ id: params[0], invoice_number: 'INV-002', seller_id: 1 }] });
        }
        if (
          sql.includes('FROM invoicing.invoice_lines') ||
          sql.includes('FROM invoicing.invoice_taxes') ||
          sql.includes('FROM invoicing.invoice_attachments') ||
          sql.includes('FROM invoicing.invoice_client')
        ) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [{ id: 1 }] });
      });
    });

    it('met à jour invoice, client, lignes, taxes et attachments', async () => {
      const id = 1;
      const invoice = { invoice_number: 'INV-002', issue_date: '2025-01-01' };
      const client = { client_first_name: 'Jane', client_last_name: 'Doe', client_email: 'jane@test.com' };
      const lines = [{ description: 'Ligne 2', amount: 200 }];
      const taxes = [{ rate: 10 }];
      const newAttachments = [{ attachment_type: 'main', filename: 'file2.pdf' }];
      const existingAttachments = '[]';

      conn.query
        .mockResolvedValueOnce({ rows: [] }) // dbAttachments
        .mockResolvedValueOnce({ rows: [{ stored_name: 'file2.pdf' }] }) // dbFiles
        .mockResolvedValue({ rows: [{ id: 1 }] }); // autres requêtes génériques

      getInvoiceByIdMock = jest.spyOn(invoiceModel, 'getInvoiceById').mockResolvedValue({
        id: 1,
        invoice_number: 'INV-002',
        seller_id: 1,
        lines: [],
        taxes: [],
        attachments: [],
        client: null,
        seller: undefined,
      });

      const result = await invoiceModel.updateInvoice(id, { invoice, client, lines, taxes, newAttachments, existingAttachments });

      expect(conn.query).toHaveBeenCalled();
      expect(saveAttachment).toHaveBeenCalledWith(conn, id, newAttachments[0]);
      expect(result).toMatchObject({ id: 1, invoice_number: 'INV-002' });
    });

    it('rollback si erreur', async () => {
      const error = new Error('Fail update');
      conn.query.mockRejectedValueOnce(error);

      await expect(invoiceModel.updateInvoice(1, {})).rejects.toThrow('Fail update');
      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });
  });
});
