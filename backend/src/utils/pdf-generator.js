// utils/pdf-generator.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument, PDFName, PDFString, PDFHexString } = require('pdf-lib');
const { generateXmpContent } = require('./xmp-helper');

const PDF_A3_DIR = path.resolve('src/uploads/pdf-a3');
const ICC_DIR = path.resolve(__dirname, 'icc');
const SRGB_PROFILE = path.join(ICC_DIR, 'sRGB.icc');

function ensurePdfDirExists() {
  if (!fs.existsSync(PDF_A3_DIR)) {
    fs.mkdirSync(PDF_A3_DIR, { recursive: true });
  }
  return PDF_A3_DIR;
}

async function embedFacturXInPdf(pdfPath, facturxPath, attachments = [], invoiceId, title) {
  ensurePdfDirExists();

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // --- Attacher Factur-X XML avec AFRelationship ---
  const xmlBytes = fs.readFileSync(facturxPath);
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X XML',
    creationDate: new Date(),      
    modificationDate: new Date(),     
    afRelationship: 'Source', // ✅ AFRelationship correct
  });

  // --- Attacher fichiers supplémentaires ---
  for (const att of attachments) {
    const fileBytes = fs.readFileSync(att.file_path);
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
  const pdfA3Path = path.join(PDF_A3_DIR, `${invoiceId}_pdf-a3.pdf`);
  const finalBytes = await pdfDoc.save();
  fs.writeFileSync(pdfA3Path, finalBytes);

  console.log(`✅ PDF/A-3 final prêt : ${pdfA3Path}`);
  return pdfA3Path;
}

module.exports = { embedFacturXInPdf, PDF_A3_DIR };
