const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument, PDFName, PDFString, PDFHexString } = require('pdf-lib');
const { generateXmpContent } = require('../facturx/xmp-helper');
const storageService = require('../../services');

const ICC_DIR = path.resolve(__dirname, 'icc');
const SRGB_PROFILE = path.join(ICC_DIR, 'sRGB.icc');

function _getPath(filePath) {
  if (!filePath) throw new Error('File path is undefined');
  console.log('🟡 _getPath input:', filePath);

  if (filePath.startsWith('invoices/') || filePath.startsWith('factur-x/') || filePath.startsWith('pdf-a3/')) {
    console.log('🟢 _getPath détecté comme relatif B2:', filePath);
    return filePath;
  }

  if (path.isAbsolute(filePath)) {
    console.log('🟢 _getPath détecté comme absolu local (ne sera pas modifié):', filePath);
    return filePath;
  }

  const resolved = path.resolve(__dirname, '../../uploads', filePath);
  console.log('🟢 _getPath relatif local résolu:', resolved);
  return resolved;
}

async function embedFacturXInPdf(pdfPath, facturxPath, attachments = [], invoiceId, title) {
  console.log('🟡 embedFacturXInPdf inputs:', { pdfPath, facturxPath, attachmentsCount: attachments.length });

  // PDF principal
  const mainPdfPath = _getPath(pdfPath);
  console.log('🟢 mainPdfPath utilisé:', mainPdfPath);
  const pdfBytes = await storageService.get(mainPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Factur-X XML
  const facturXPath = _getPath(facturxPath);
  console.log('🟢 facturXPath utilisé:', facturXPath);
  const xmlBytes = await storageService.get(facturXPath);
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X XML',
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: 'Source',
  });

  // Attachments
  for (const att of attachments) {
    const attPath = _getPath(att.file_path);
    console.log('🟢 attachment path:', attPath);
    const attBytes = await storageService.get(attPath);
    await pdfDoc.attach(attBytes, att.file_name, {
      mimeType: att.mimeType || 'application/octet-stream',
      description: att.description || 'Additional attachment',
      afRelationship: att.afRelationship || 'Data',
      creationDate: new Date(),
      modificationDate: new Date(),
    });
  }

  // Métadonnées PDF
  pdfDoc.setTitle(title || `Invoice ${invoiceId}`);
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X et attachments');
  pdfDoc.setCreator('eInvoicing');
  pdfDoc.setProducer('eInvoicing');

  // XMP
  const xmpContent = generateXmpContent({ invoiceId, xmlFileName: 'factur-x.xml', title: title || `Invoice ${invoiceId}` });
  const metadataStream = pdfDoc.context.stream(Buffer.from(xmpContent, 'utf8'), {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);

  // OutputIntent sRGB
  const iccBytes = fs.readFileSync(SRGB_PROFILE);
  const iccStream = pdfDoc.context.flateStream(iccBytes, { N: 3, Alternate: PDFName.of('DeviceRGB') });
  const iccRef = pdfDoc.context.register(iccStream);
  const outputIntentDict = pdfDoc.context.obj({
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFA1'),
    OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'),
    Info: PDFString.of('sRGB IEC61966-2.1'),
    DestOutputProfile: iccRef,
  });
  pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([pdfDoc.context.register(outputIntentDict)]));

  // ID PDF/A-3
  const idBuffer = crypto.randomBytes(16);
  const hexId = idBuffer.toString('hex').toUpperCase();
  pdfDoc.context.trailerInfo.ID = [PDFHexString.of(hexId), PDFHexString.of(hexId)];

  // Nom du fichier correct
  const outputFileName = `${invoiceId}_pdf-a3.pdf`;
  const relativeOutputPath = `pdf-a3/${outputFileName}`;
  console.log('🟢 relativeOutputPath pour sauvegarde:', relativeOutputPath);

  // Sauvegarde
  const finalBytes = await pdfDoc.save();
  const savedPath = await storageService.save(finalBytes, relativeOutputPath);

  console.log(`✅ PDF/A-3 final prêt : ${savedPath}`);
  return savedPath;
}

module.exports = { embedFacturXInPdf };
