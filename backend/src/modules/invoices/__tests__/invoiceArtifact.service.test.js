/* global describe, it, expect, beforeEach, beforeAll, afterAll, jest */

const fs = require('fs/promises');
const path = require('path');

const { generateInvoiceArtifacts } = require('../invoiceArtifact.service');
const { embedFacturXInPdf } = require('../../../utils/invoice-pdf/pdf-generator');
const { generateFacturXXML } = require('../../../utils/facturx/facturx-generator');
const InvoicesAttachmentsModel = require('../invoiceAttachments.model');
const { getFinalPath } = require('../../../utils/fileNaming');
const logger = require('../../../utils/logger');
const InvoiceService = require('../invoices.service');

// 🔹 Mocks
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

jest.mock('../invoices.service', () => ({
  getInvoiceById: jest.fn(),
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

  const uploadsDir = '/tmp/uploads';

  beforeAll(() => {
    process.env.ENCRYPTION_KEY =
      process.env.ENCRYPTION_KEY || '01234567890123456789012345678901';

    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    logger.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    getFinalPath.mockImplementation((subPath) => `${uploadsDir}/${subPath}`);

    jest.spyOn(fs, 'mkdir').mockResolvedValue();
    jest.spyOn(fs, 'writeFile').mockResolvedValue();

    jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
  });

  // ========================
  // ✅ CAS PRINCIPAL
  // ========================
  it('génère correctement le XML et le PDF/A-3', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([
      { file_path: '/fake/add1.pdf' },
    ]);
    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({
      xmlPath: expect.stringContaining('factur-x/123-factur-x.xml'),
      pdfA3Path: '/fake/final.pdf',
    });
  });

  // ========================
  // ⚠️ PDF manquant
  // ========================
  it('retourne pdfA3Path null si le PDF principal est introuvable', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoicesAttachmentsModel.getAttachment.mockResolvedValue(null);

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({
      xmlPath: expect.any(String),
      pdfA3Path: null,
    });
  });

  // ========================
  // ❌ erreur globale
  // ========================
  it('gère une erreur globale', async () => {
    fs.mkdir.mockRejectedValueOnce(new Error('Erreur mkdir'));

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({ xmlPath: null, pdfA3Path: null });
    expect(logger.error).toHaveBeenCalled();
  });

  // ========================
  // 🥇 acompte OK
  // ========================
  it('gère un acompte pour une facture finale', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');

    InvoiceService.getInvoiceById.mockResolvedValue({
      total: 50,
      issue_date: '2024-01-01',
      invoice_number: 'FAC-001',
    });

    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([]);
    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const invoice = {
      ...mockInvoice,
      invoice_type: 'final',
      original_invoice_id: 42,
    };

    await generateInvoiceArtifacts(invoice);

    expect(InvoiceService.getInvoiceById).toHaveBeenCalledWith(42);
  });

  // ========================
  // 🥈 acompte erreur
  // ========================
  it('log un warning si récupération acompte échoue', async () => {
    jest.spyOn(logger, 'warn').mockImplementation(() => {});

    generateFacturXXML.mockReturnValue('<xml></xml>');
    InvoiceService.getInvoiceById.mockRejectedValue(new Error('fail'));

    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([]);
    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const invoice = {
      ...mockInvoice,
      invoice_type: 'final',
      original_invoice_id: 42,
    };

    await generateInvoiceArtifacts(invoice);

    expect(logger.warn).toHaveBeenCalled();

    logger.warn.mockRestore();
  });

  // ========================
  // 🧪 client fallback
  // ========================
  it('utilise les champs fallback du client', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');

    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([]);
    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const invoice = {
      ...mockInvoice,
      client: {
        client_legal_name: 'Fallback Name',
        client_address: 'Fallback Address',
      },
    };

    await generateInvoiceArtifacts(invoice);

    expect(generateFacturXXML).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.objectContaining({
          legal_name: 'Fallback Name',
          address: 'Fallback Address',
        }),
      })
    );
  });

  // ========================
  // 🧪 normalisation paths
  // ========================
  it('normalise les chemins des pièces jointes', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');

    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });

    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([
      { file_path: '/root/backend/uploads/file.pdf' },
    ]);

    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    await generateInvoiceArtifacts(mockInvoice);

    expect(embedFacturXInPdf).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({
          file_path: 'uploads/file.pdf',
        }),
      ]),
      123
    );
  });

  // ========================
  // 🧪 embed erreur
  // ========================
  it('retourne null si embed PDF échoue', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');

    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([]);

    embedFacturXInPdf.mockRejectedValue(new Error('PDF error'));

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result).toEqual({
      xmlPath: expect.any(String),
      pdfA3Path: null,
    });
  });

  // ========================
  // 🧪 sans attachments
  // ========================
  it('fonctionne sans pièces jointes additionnelles', async () => {
    generateFacturXXML.mockReturnValue('<xml></xml>');

    InvoicesAttachmentsModel.getAttachment.mockResolvedValue({
      file_path: '/fake/main.pdf',
    });
    InvoicesAttachmentsModel.getAdditionalAttachments.mockResolvedValue([]);

    embedFacturXInPdf.mockResolvedValue('/fake/final.pdf');

    const result = await generateInvoiceArtifacts(mockInvoice);

    expect(result.pdfA3Path).toBe('/fake/final.pdf');
  });
});