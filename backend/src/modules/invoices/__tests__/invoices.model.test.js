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

    // --- Crée le dossier uploads/invoices si absent ---
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

    it('rollback si erreur', async () => {
      const error = new Error('Fail update');
      conn.query.mockRejectedValueOnce(error);

      await expect(invoiceModel.updateInvoice(1, {})).rejects.toThrow('Fail update');
      expect(conn.query).toHaveBeenCalledWith('ROLLBACK');
      expect(conn.release).toHaveBeenCalled();
    });
  });
});
