// utils/pdf-generator.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument, PDFName, PDFString, PDFHexString } = require('pdf-lib');
const { generateXmpContent } = require('../facturx/xmp-helper');
const storageService = require('../../services'); 

const ICC_DIR = path.resolve(__dirname, 'icc');
const SRGB_PROFILE = path.join(ICC_DIR, 'sRGB.icc');

async function embedFacturXInPdf(pdfPath, facturxPath, attachments = [], invoiceId, title) {

  const relativePdfPath = pdfPath.split('uploads/')[1]; 
  const pdfBytes = await storageService.get(relativePdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // --- Attacher Factur-X XML avec AFRelationship ---
  const relativeFacturXPath = facturxPath.split('uploads/')[1]; 
  const xmlBytes = await storageService.get(relativeFacturXPath);
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X XML',
    creationDate: new Date(),      
    modificationDate: new Date(),     
    afRelationship: 'Source', 
  });

  // --- Attacher fichiers supplémentaires ---
  for (const att of attachments) {
    const relativePath = att.file_path.split('uploads/')[1];
    const fileBytes = await storageService.get(relativePath);

    await pdfDoc.attach(fileBytes, att.file_name, {
      mimeType: att.mimeType || 'application/octet-stream',
      description: att.description || 'Additional attachment',
      afRelationship: att.afRelationship || 'Data',
      creationDate: new Date(),
      modificationDate: new Date(),
    });
  }

  // --- Métadonnées PDF ---
  pdfDoc.setTitle(title || `Invoice ${invoiceId}`);
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X et attachments');
  pdfDoc.setCreator('eInvoicing');
  pdfDoc.setProducer('eInvoicing');

  // --- XMP ---
  const xmpContent = generateXmpContent({
    invoiceId,
    xmlFileName: 'factur-x.xml',
    title: title || `Invoice ${invoiceId}`,
  });
  const metadataStream = pdfDoc.context.stream(Buffer.from(xmpContent, 'utf8'), {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);

  // --- OutputIntent sRGB ---
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

  // --- ID (obligatoire PDF/A-3) ---
  const idBuffer = crypto.randomBytes(16);
  const hexId = idBuffer.toString('hex').toUpperCase(); // même ID deux fois, comme dans les PDF conformes
  pdfDoc.context.trailerInfo.ID = [
    PDFHexString.of(hexId),
    PDFHexString.of(hexId),
  ];  

  // --- Sauvegarde ---
  const finalBytes = await pdfDoc.save();
  const relativePath = `pdf-a3/${invoiceId}_pdf-a3.pdf`;

  const savedPath = await storageService.save(finalBytes, relativePath);

  console.log(`✅ PDF/A-3 final prêt : ${savedPath}`);
}

module.exports = { embedFacturXInPdf };
