/* global describe, it, expect, beforeEach, jest */
const fs = require('fs');
const { Resend } = require('resend');

const { sendInvoiceMail } = require('../invoiceMail.service');
const { getInvoiceById } = require('../invoices.service');
const { getSellerById } = require('../../sellers/sellers.model');

// Mocks
jest.mock('../invoices.service', () => ({
  getInvoiceById: jest.fn(),
}));
jest.mock('../../sellers/sellers.model', () => ({
  getSellerById: jest.fn(),
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: { send: jest.fn() },
    })),
  };
});

describe('invoiceMail.service avec Resend', () => {
  let fakeInvoice, fakeSeller, fakePdfBuffer, fakeResend;

  beforeEach(() => {
    jest.clearAllMocks();

    fakeInvoice = {
      id: 1,
      seller_id: 2,
      invoice_number: 'INV-001',
      client: { legal_name: 'Client Test', email: 'client@test.com' },
      attachments: [{ filename: 'INV-001_pdf-a3.pdf' }]
    };

    fakeSeller = {
      id: 2,
      legal_name: 'Seller Test',
      smtp_from: 'from@test.com',
      active: true
    };

    fakePdfBuffer = Buffer.from('PDF CONTENT');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(fakePdfBuffer);

    fakeResend = new Resend();
    fakeResend.emails.send.mockResolvedValue({ id: 'abc123', status: 'sent' });
  });

  it('échoue si la facture est introuvable', async () => {
    getInvoiceById.mockResolvedValue(null);
    await expect(sendInvoiceMail(1)).rejects.toThrow('Facture introuvable');
  });

  it('échoue si le client n\'a pas d\'email et aucun destinataire fourni', async () => {
    getInvoiceById.mockResolvedValue({ ...fakeInvoice, client: {} });
    await expect(sendInvoiceMail(1)).rejects.toThrow("Client n'a pas d'email");
  });

  it('échoue si le vendeur est introuvable', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(null);
    await expect(sendInvoiceMail(1)).rejects.toThrow("Vendeur introuvable");
  });

  it('échoue si le PDF n\'existe pas', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);
    fs.existsSync.mockReturnValue(false);
    await expect(sendInvoiceMail(1)).rejects.toThrow("PDF/A-3 introuvable");
  });

});
