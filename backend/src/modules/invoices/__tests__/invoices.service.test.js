// tests/services/invoices.service.test.js
const InvoicesModel = require('../invoices.model');
const InvoiceArtifactService = require('../invoiceArtifact.service');
const InvoiceStatusModel = require('../invoiceStatus.model');
const InvoicesService = require('../invoices.service');

jest.mock('../invoices.model', () => ({
  getAllInvoices: jest.fn(),
  getInvoiceById: jest.fn(),
  createInvoice: jest.fn(),
  updateInvoice: jest.fn(),
  deleteInvoice: jest.fn(),
  getInvoicesBySeller: jest.fn(),
  getDepositInvoices: jest.fn(),
}));

jest.mock('../invoiceArtifact.service', () => ({
  generateInvoiceArtifacts: jest.fn(),
}));

jest.mock('../invoiceStatus.model', () => ({
  getInvoiceStatusComment: jest.fn(),
}));

const { describe, it, expect, afterEach } = globalThis;

describe('InvoicesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listInvoices appelle le modèle et retourne toutes les factures', async () => {
    const mockInvoices = [{ id: 1 }, { id: 2 }];
    InvoicesModel.getAllInvoices.mockResolvedValue(mockInvoices);

    const result = await InvoicesService.listInvoices();

    expect(InvoicesModel.getAllInvoices).toHaveBeenCalled();
    expect(result).toEqual(mockInvoices);
  });

  it('createInvoice appelle le modèle et génère les artefacts', async () => {
    const data = { invoice: {}, client: {}, lines: [], taxes: [], attachments: [] };
    const createdInvoice = { id: 123 };
    InvoicesModel.createInvoice.mockResolvedValue(createdInvoice);
    InvoiceArtifactService.generateInvoiceArtifacts.mockResolvedValue({
      xmlPath: '/fake/invoice.xml',
      pdfA3Path: '/fake/invoice.pdf',
    });

    const result = await InvoicesService.createInvoice(data);

    expect(InvoicesModel.createInvoice).toHaveBeenCalledWith(data);
    expect(InvoiceArtifactService.generateInvoiceArtifacts).toHaveBeenCalledWith(createdInvoice);
    expect(result).toEqual({
      ...createdInvoice,
      facturxPath: '/fake/invoice.xml',
      pdfPath: '/fake/invoice.pdf',
    });
  });

  it('updateInvoice met à jour la facture et génère les artefacts', async () => {
    const id = 123;
    const data = { invoice: {}, client: {}, lines: [], taxes: [], newAttachments: [], existingAttachments: [] };
    const updatedInvoice = { id };
    InvoicesModel.updateInvoice.mockResolvedValue(updatedInvoice);
    InvoiceArtifactService.generateInvoiceArtifacts.mockResolvedValue({
      xmlPath: '/fake/updated.xml',
      pdfA3Path: '/fake/updated.pdf',
    });

    const result = await InvoicesService.updateInvoice(id, data);

    expect(InvoicesModel.updateInvoice).toHaveBeenCalledWith(id, data);
    expect(InvoiceArtifactService.generateInvoiceArtifacts).toHaveBeenCalledWith(updatedInvoice);
    expect(result).toEqual({
      ...updatedInvoice,
      facturxPath: '/fake/updated.xml',
      pdfPath: '/fake/updated.pdf',
    });
  });

  it('deleteInvoice appelle le modèle', async () => {
    InvoicesModel.deleteInvoice.mockResolvedValue(true);

    const result = await InvoicesService.deleteInvoice(123, null); 

    expect(InvoicesModel.deleteInvoice).toHaveBeenCalledWith(123, null);
    expect(result).toBe(true);
  });

  it('getInvoiceStatusComment appelle le modèle', async () => {
    InvoiceStatusModel.getInvoiceStatusComment.mockResolvedValue('OK');
    const result = await InvoicesService.getInvoiceStatusComment(123, 201);
    expect(InvoiceStatusModel.getInvoiceStatusComment).toHaveBeenCalledWith(123, 201);
    expect(result).toBe('OK');
  });

  describe('getInvoice', () => {
    it('throw Forbidden si pas de seller', async () => {
      await expect(InvoicesService.getInvoice(1, null))
        .rejects.toThrow('Forbidden');
      expect(InvoicesModel.getInvoiceById).not.toHaveBeenCalled();
    });

    it('retourne null si facture introuvable', async () => {
      InvoicesModel.getInvoiceById.mockResolvedValue(null);
      const result = await InvoicesService.getInvoice(1, { id: 42 });
      expect(result).toBeNull();
    });

    it('throw Forbidden si la facture appartient à un autre seller', async () => {
      InvoicesModel.getInvoiceById.mockResolvedValue({
        id: 1,
        seller: { id: 99 }
      });
      await expect(InvoicesService.getInvoice(1, { id: 42 }))
        .rejects.toThrow('Forbidden');
    });

    it('retourne la facture si le seller correspond', async () => {
      const invoice = { id: 1, seller: { id: 42 } };
      InvoicesModel.getInvoiceById.mockResolvedValue(invoice);
      const result = await InvoicesService.getInvoice(1, { id: 42 });
      expect(result).toEqual(invoice);
    });
  });

  describe('getDepositInvoicesBySeller', () => {
    it('throw si seller absent', async () => {
      await expect(InvoicesService.getDepositInvoicesBySeller(null))
        .rejects.toThrow('Seller is required');
    });

    it('délègue au model avec seller.id', async () => {
      InvoicesModel.getDepositInvoices.mockResolvedValue([{ id: 1 }]);
      const result = await InvoicesService.getDepositInvoicesBySeller({ id: 5 });
      expect(InvoicesModel.getDepositInvoices).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('deleteInvoice', () => {
    it('propage l erreur si le model throw', async () => {
      InvoicesModel.deleteInvoice.mockRejectedValue(new Error('DB error'));
      await expect(InvoicesService.deleteInvoice(1, null))
        .rejects.toThrow('DB error');
    });
  });

  // Correction du test createInvoice existant
  it('createInvoice passe les bons paramètres au model', async () => {
    const data = { invoice: { invoice_number: 'X' }, client: {}, lines: [], taxes: [], attachments: [] };
    const createdInvoice = { id: 123 };
    InvoicesModel.createInvoice.mockResolvedValue(createdInvoice);
    InvoiceArtifactService.generateInvoiceArtifacts.mockResolvedValue({
      xmlPath: '/x.xml', pdfA3Path: '/x.pdf'
    });

    await InvoicesService.createInvoice(data);

    // Le service destructure — il passe un objet reconstruit, pas data directement
    expect(InvoicesModel.createInvoice).toHaveBeenCalledWith({
      invoice: data.invoice,
      client: data.client,
      lines: data.lines,
      taxes: data.taxes,
      attachments: data.attachments,
    });
  });  
});
