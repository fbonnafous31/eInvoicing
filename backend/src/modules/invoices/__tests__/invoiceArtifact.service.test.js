/* global describe, it, expect, beforeEach, beforeAll, afterAll */

jest.mock('fs/promises');
jest.mock('path', () => ({
  resolve: jest.fn(() => '/abs/path/uploads/factur-x'),
  join: jest.fn((...args) => args.join('/')),
}));
jest.mock('../../../utils/facturx-generator', () => ({
  generateFacturXXML: jest.fn(),
}));
jest.mock('../../../utils/pdf-generator', () => ({
  embedFacturXInPdf: jest.fn(),
}));
jest.mock('../invoiceAttachments.model', () => ({
  getAttachment: jest.fn(),
  getAdditionalAttachments: jest.fn(),
}));

const fs = require('fs/promises');
const { embedFacturXInPdf } = require('../../../utils/pdf-generator');
const { generateFacturXXML } = require('../../../utils/facturx-generator');
const InvoicesAttachmentsModel = require('../invoiceAttachments.model');
const { generateInvoiceArtifacts } = require('../invoiceArtifact.service');

describe('InvoiceArtifactService', () => {
  const mockInvoice = {
    id: 123,
    seller: { name: 'Mon Vendeur' },
    client: { legal_name: 'Client Test', address: 'Rue', city: 'Paris' },
    lines: [{ description: 'Produit 1', amount: 100 }],
    taxes: [],
    attachments: [],
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ génère correctement le XML et le PDF/A-3', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({ file_path: '/fake/main.pdf' });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([
      { file_path: '/fake/add1.pdf' },
    ]);
    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(fs.mkdir).toHaveBeenCalledWith('/abs/path/uploads/factur-x', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/abs/path/uploads/factur-x/123-factur-x.xml',
      '<xml></xml>',
      'utf-8'
    );
    expect(result).toEqual({
      xmlPath: '/abs/path/uploads/factur-x/123-factur-x.xml',
      pdfA3Path: '/fake/final.pdf',
    });
  });

  it('⚠️ retourne des chemins null si le PDF principal est introuvable', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoicesAttachmentsModel.getAttachment.mockResolvedValue(null);

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({
      xmlPath: '/abs/path/uploads/factur-x/123-factur-x.xml',
      pdfA3Path: null,
    });
  });

  it('❌ gère proprement une erreur lors de la génération du XML', async () => {
    fs.mkdir.mockRejectedValue(new Error('Erreur mkdir'));

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({ xmlPath: null, pdfA3Path: null });
    expect(console.error).toHaveBeenCalled();
  });
});
