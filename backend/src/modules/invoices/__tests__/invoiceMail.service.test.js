/* global describe, it, expect, beforeEach, jest */
const fs = require('fs');
const nodemailer = require('nodemailer');

const { sendInvoiceMail } = require('../invoiceMail.service');
const { getInvoiceById } = require('../invoices.service');
const { getSellerById } = require('../../sellers/sellers.model');

// Mock des modules
jest.mock('../invoices.service', () => ({
  getInvoiceById: jest.fn(),
}));
jest.mock('../../sellers/sellers.model', () => ({
  getSellerById: jest.fn(),
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));
jest.mock('nodemailer');

describe('invoiceMail.service', () => {
  let fakeInvoice, fakeSeller, fakeTransporter;

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
      smtp_host: 'smtp.test.com',
      smtp_port: 587,
      smtp_user: 'user',
      smtp_pass: 'pass',
      smtp_from: 'from@test.com',
      smtp_secure: false,
      active: true
    };

    fakeTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ response: '250 OK' })
    };

    nodemailer.createTransport.mockReturnValue(fakeTransporter);
    fs.existsSync.mockReturnValue(true);
  });

  it('envoie un email avec succès', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);

    const info = await sendInvoiceMail(1, 'Hello', 'Facture', 'client@test.com');

    expect(getInvoiceById).toHaveBeenCalledWith(1);
    expect(getSellerById).toHaveBeenCalledWith(2);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: fakeSeller.smtp_host,
      port: fakeSeller.smtp_port,
      secure: fakeSeller.smtp_secure,
      auth: { user: fakeSeller.smtp_user, pass: fakeSeller.smtp_pass }
    });

    expect(fakeTransporter.verify).toHaveBeenCalled();
    expect(fakeTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: fakeSeller.smtp_from,
      to: 'client@test.com',
      subject: 'Facture',
      text: expect.stringContaining('Hello'),
      attachments: [{ filename: 'INV-001_PDF-A3.pdf', path: expect.any(String) }]
    }));

    expect(info).toEqual({ response: '250 OK' });
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

  it('échoue si les paramètres SMTP sont incomplets', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue({ id: 2 });

    await expect(sendInvoiceMail(1)).rejects.toThrow("Le vendeur n'a pas configuré de paramètres SMTP valides");
  });

  it('échoue si le PDF n\'existe pas', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);
    fs.existsSync.mockReturnValue(false);

    await expect(sendInvoiceMail(1)).rejects.toThrow("PDF/A-3 introuvable");
  });

  it('échoue si sendMail renvoie une erreur', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);
    fakeTransporter.sendMail.mockRejectedValue(new Error('SMTP fail'));

    await expect(sendInvoiceMail(1)).rejects.toThrow('SMTP fail');
  });

});
