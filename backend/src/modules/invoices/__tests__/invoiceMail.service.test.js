/* global describe, it, expect, beforeEach, jest */
const fs = require('fs');
const { sendInvoiceMail } = require('../invoiceMail.service');
const { getInvoiceById } = require('../invoices.service');
const { getSellerById } = require('../../sellers/sellers.model');

// 🔹 Mocks des services et du FS
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

// 🔹 Mock Resend correctement pour Jest
jest.mock('resend', () => {
  const sendFn = jest.fn(); // mock interne
  return {
    Resend: jest.fn(() => ({
      emails: { send: sendFn },
    })),
    __sendMock: sendFn, // export pour pouvoir le réinitialiser dans beforeEach
  };
});

const { __sendMock } = require('resend');

describe('invoiceMail.service avec Resend', () => {
  let fakeInvoice, fakeSeller, fakePdfBuffer;

  beforeEach(() => {
    jest.clearAllMocks();

    // PDF fictif
    fakePdfBuffer = Buffer.from('PDF CONTENT');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(fakePdfBuffer);

    // Envoi mocké par défaut
    __sendMock.mockResolvedValue({ id: 'abc123', status: 'sent' });

    // Facture fictive
    fakeInvoice = {
      id: 1,
      seller_id: 2,
      invoice_number: 'INV-001',
      client: { legal_name: 'Client Test', email: 'client@test.com' },
      attachments: [{ filename: 'INV-001_pdf-a3.pdf' }],
    };

    // Vendeur fictif
    fakeSeller = {
      id: 2,
      legal_name: 'Seller Test',
      smtp_from: 'from@test.com',
      active: true,
    };
  });

  // ✅ Test succès
  it('envoie un email avec succès via Resend', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);

    const response = await sendInvoiceMail(1, 'Hello', 'Facture', 'client@test.com');

    // Vérifie juste la réponse
    expect(response).toEqual({ id: 'abc123', status: 'sent' });

    // Vérifie que l'envoi a été appelé
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

    // Vérifie que le PDF a été lu
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  // ❌ Tests d’échec
  it('échoue si la facture est introuvable', async () => {
    getInvoiceById.mockResolvedValue(null);
    await expect(sendInvoiceMail(1)).rejects.toThrow('Facture introuvable');
  });

  it("échoue si le client n'a pas d'email et aucun destinataire fourni", async () => {
    getInvoiceById.mockResolvedValue({ ...fakeInvoice, client: {} });
    await expect(sendInvoiceMail(1)).rejects.toThrow("Client n'a pas d'email");
  });

  it('échoue si le vendeur est introuvable', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(null);
    await expect(sendInvoiceMail(1)).rejects.toThrow("Vendeur introuvable");
  });

  it("échoue si le PDF n'existe pas", async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);
    fs.existsSync.mockReturnValue(false);
    await expect(sendInvoiceMail(1)).rejects.toThrow("PDF/A-3 introuvable");
  });

  it('échoue si resend.emails.send renvoie une erreur', async () => {
    getInvoiceById.mockResolvedValue(fakeInvoice);
    getSellerById.mockResolvedValue(fakeSeller);

    __sendMock.mockRejectedValueOnce(new Error('Resend fail'));

    await expect(sendInvoiceMail(1, 'Hello', 'Facture', 'client@test.com'))
      .rejects.toThrow('Resend fail');
  });
});
