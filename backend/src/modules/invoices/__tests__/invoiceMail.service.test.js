/* global describe, it, expect, beforeEach, jest */
const storageService = require('../../../services');
const { sendInvoiceMail } = require('../invoiceMail.service');
const { getInvoiceById } = require('../invoices.service');
const { getSellerById } = require('../../sellers/sellers.model');

// 🔹 Mocks des services
jest.mock('../invoices.service', () => ({
  getInvoiceById: jest.fn(),
}));
jest.mock('../../sellers/sellers.model', () => ({
  getSellerById: jest.fn(),
}));
jest.mock('../../../services', () => ({
  get: jest.fn(),
}));

// 🔹 Mock Resend
jest.mock('resend', () => {
  const sendFn = jest.fn();
  return {
    Resend: jest.fn(() => ({ emails: { send: sendFn } })),
    __sendMock: sendFn,
  };
});

const { __sendMock } = require('resend');

describe('invoiceMail.service avec Resend', () => {
  let fakeInvoice, fakeSeller, fakePdfBuffer;

  beforeEach(() => {
    jest.clearAllMocks();

    fakePdfBuffer = Buffer.from('PDF CONTENT');
    storageService.get.mockResolvedValue(fakePdfBuffer);
    __sendMock.mockResolvedValue({ id: 'abc123', status: 'sent' });

    fakeInvoice = {
      id: 1,
      seller_id: 2,
      invoice_number: 'INV-001',
      client: { legal_name: 'Client Test', email: 'client@test.com' },
    };

    fakeSeller = {
      id: 2,
      legal_name: 'Seller Test',
      smtp_from: 'from@test.com',
      active: true,
    };
  });

  it('✅ envoie un email avec succès via Resend', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);

    const response = await sendInvoiceMail(1, 'Hello', 'Facture', 'client@test.com');

    expect(response).toEqual({ id: 'abc123', status: 'sent' });

    expect(storageService.get).toHaveBeenCalledWith('pdf-a3/1_pdf-a3.pdf');

    expect(__sendMock).toHaveBeenCalledWith(expect.objectContaining({
      from: fakeSeller.smtp_from,
      to: 'client@test.com',
      subject: 'Facture',
      text: expect.stringContaining('Hello'),
      html: expect.stringContaining('Hello'),
      attachments: [
        { filename: 'INV-001_PDF-A3.pdf', content: expect.any(String), type: 'application/pdf', encoding: 'base64' }
      ],
    }));
  });

  it('❌ échoue si la facture est introuvable', async () => {
    getInvoiceById.mockResolvedValue(null);
    await expect(sendInvoiceMail(1)).rejects.toThrow('Facture introuvable');
  });

  it("❌ échoue si le client n'a pas d'email et aucun destinataire fourni", async () => {
    getInvoiceById.mockResolvedValue({ ...fakeInvoice, client: {} });
    await expect(sendInvoiceMail(1)).rejects.toThrow("Client n'a pas d'email");
  });

  it('❌ échoue si le vendeur est introuvable', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(null);
    await expect(sendInvoiceMail(1)).rejects.toThrow("Vendeur introuvable");
  });

  it("❌ échoue si le PDF n'existe pas", async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);
    storageService.get.mockRejectedValueOnce(new Error('Not found'));

    await expect(sendInvoiceMail(1)).rejects.toThrow('PDF/A-3 introuvable pour la facture 1');
  });

  it("❌ échoue si resend.emails.send renvoie une erreur", async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);
    __sendMock.mockRejectedValueOnce(new Error('Resend fail'));

    await expect(sendInvoiceMail(1, 'Hello', 'Facture', 'client@test.com'))
      .rejects.toThrow('Resend fail');
  });

  // 🔹 Nouveaux tests pour couvrir les fallbacks
  it('✅ fallback sur fromAddress, sellerName et invoiceNumber', async () => {
    // Facture sans invoice_number, vendeur sans smtp_from et legal_name
    getInvoiceById.mockResolvedValue({ ...fakeInvoice, invoice_number: null });
    getSellerById.mockResolvedValue({ smtp_from: null, smtp_user: null, legal_name: null });

    await sendInvoiceMail(fakeInvoice.id); // <-- pas de message pour tester fallback

    expect(__sendMock).toHaveBeenCalledWith(expect.objectContaining({
      from: 'no-reply@example.com',
      to: fakeInvoice.client.email,
      subject: `Votre facture n°${fakeInvoice.id}`,
      html: expect.stringContaining('Votre société'),
      text: expect.stringContaining('Votre société'),
      attachments: expect.any(Array),
    }));
  });

  it('✅ fallback sur sellerName si vide mais invoiceNumber présent', async () => {
    // Vendeur sans legal_name, facture avec invoice_number présent
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue({ smtp_from: 'from@test.com', smtp_user: null, legal_name: null });

    await sendInvoiceMail(fakeInvoice.id); // <-- pas de message

    expect(__sendMock).toHaveBeenCalledWith(expect.objectContaining({
      from: 'from@test.com',
      to: fakeInvoice.client.email,
      subject: expect.stringContaining(fakeInvoice.invoice_number),
      html: expect.stringContaining('Votre société'), // fallback sur sellerName
      text: expect.stringContaining('Votre société'),
      attachments: expect.any(Array),
    }));
  });

  it('✅ fallback sur invoiceNumber si null mais sellerName présent', async () => {
    // Facture sans invoice_number, vendeur avec nom
    getInvoiceById.mockResolvedValue({ ...fakeInvoice, invoice_number: null });
    getSellerById.mockResolvedValue({ smtp_from: 'from@test.com', smtp_user: null, legal_name: 'Seller Name' });

    await sendInvoiceMail(fakeInvoice.id); // <-- pas de message

    expect(__sendMock).toHaveBeenCalledWith(expect.objectContaining({
      from: 'from@test.com',
      to: fakeInvoice.client.email,
      subject: `Votre facture n°${fakeInvoice.id}`, // fallback sur invoiceId
      html: expect.stringContaining('Seller Name'),
      text: expect.stringContaining('Seller Name'),
      attachments: expect.any(Array),
    }));
  });
});