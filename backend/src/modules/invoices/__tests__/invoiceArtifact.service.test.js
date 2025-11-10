/* global describe, it, expect, beforeEach, beforeAll, afterAll */

const fs = require('fs/promises');
const path = require('path');
const { generateInvoiceArtifacts } = require('../invoiceArtifact.service');
const { embedFacturXInPdf } = require('../../../utils/invoice-pdf/pdf-generator');
const { generateFacturXXML } = require('../../../utils/facturx/facturx-generator');
const InvoicesAttachmentsModel = require('../invoiceAttachments.model');
const { getFinalPath } = require('../../../utils/fileNaming');

jest.mock('../../../utils/facturx/facturx-generator', () => ({
  generateFacturXXML: jest.fn(),
}));
jest.mock('../../../utils/invoice-pdf/pdf-generator', () => ({
  embedFacturXInPdf: jest.fn(),
}));
jest.mock('../invoiceAttachments.model', () => ({
  getAttachment: jest.fn(),
  getAdditionalAttachments: jest.fn(),
}));
jest.mock('../../../utils/fileNaming', () => ({
  getFinalPath: jest.fn(),
}));

describe('InvoiceArtifactService', () => {
  const mockInvoice = {
    id: 123,
    seller: { name: 'Mon Vendeur' },
    client: { legal_name: 'Client Test', address: 'Rue', city: 'Paris' },
    lines: [{ description: 'Produit 1', amount: 100 }],
    taxes: [],
    attachments: [],
  };

  const uploadsDir = '/home/francois/dev/eInvoicing/backend/src/uploads';

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // On mock getFinalPath pour renvoyer le vrai dossier uploads local
    getFinalPath.mockImplementation((subPath) => `${uploadsDir}/${subPath}`);

    // Mock fs
    jest.spyOn(fs, 'mkdir').mockResolvedValue();
    jest.spyOn(fs, 'writeFile').mockResolvedValue();

    jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
  });

  it('✅ génère correctement le XML et le PDF/A-3', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({ file_path: '/fake/main.pdf' });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([
      { file_path: '/fake/add1.pdf' },
    ]);
    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const result = await generateInvoiceArtifacts(mockInvoice);

    // ✅ On ne fige plus le chemin absolu → on vérifie juste le dossier et l’option
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('factur-x'),
      expect.objectContaining({ recursive: true })
    );

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('factur-x/123-factur-x.xml'),
      '<xml></xml>'
    );

    expect(result).toEqual({
      xmlPath: expect.stringContaining('factur-x/123-factur-x.xml'),
      pdfA3Path: '/fake/final.pdf',
    });
  });

  it('⚠️ retourne des chemins null si le PDF principal est introuvable', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoicesAttachmentsModel.getAttachment.mockResolvedValue(null);

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({
      xmlPath: expect.stringContaining('factur-x/123-factur-x.xml'),
      pdfA3Path: null,
    });
  });

  it('❌ gère proprement une erreur lors de la génération du XML', async () => {
    fs.mkdir.mockRejectedValueOnce(new Error('Erreur mkdir'));

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({ xmlPath: null, pdfA3Path: null });
    expect(console.error).toHaveBeenCalled();
  });
});
