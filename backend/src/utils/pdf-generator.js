// utils/pdf-generator.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument, PDFName, PDFString } = require('pdf-lib');
const { patchPdfA3 } = require('./pdf-postprocess');
const { generateXmpContent } = require('./xmp-helper');
const { execSync } = require('child_process');

const PDF_A3_DIR = path.resolve('src/uploads/pdf-a3');
const ICC_DIR = path.resolve(__dirname, 'icc');
const SRGB_PROFILE = path.join(ICC_DIR, 'sRGB.icc');

function ensurePdfDirExists() {
  if (!fs.existsSync(PDF_A3_DIR)) {
    console.log(`[PDF] Création du répertoire : ${PDF_A3_DIR}`);
    fs.mkdirSync(PDF_A3_DIR, { recursive: true });
  }
  return PDF_A3_DIR;
}

function uncompressPdf(pdfPath) {
  const tmpPath = pdfPath.replace(/\.pdf$/, '_uncompressed.pdf');
  console.log(`[PDF] Décompression des streams avec qpdf : ${pdfPath} -> ${tmpPath}`);
  execSync(`qpdf --qdf --stream-data=uncompress "${pdfPath}" "${tmpPath}"`, { stdio: 'inherit' });
  return tmpPath;
}

function linearizePdf(pdfPath) {
  const tmpPath = pdfPath.replace(/\.pdf$/, '_linearized.pdf');
  console.log(`[PDF] Linearisation avec qpdf : ${pdfPath} -> ${tmpPath}`);
  execSync(`qpdf --linearize "${pdfPath}" "${tmpPath}"`, { stdio: 'inherit' });
  fs.renameSync(tmpPath, pdfPath);
  console.log(`[PDF] PDF linéarisé et remplacé : ${pdfPath}`);
}

function injectXmpToPdfLib(pdfDoc, { invoiceId, title }) {
  console.log('[PDF] Injection XMP dans le PDF...');
  const xmpContent = generateXmpContent({
    invoiceId,
    xmlFileName: 'factur-x.xml',
    title,
  });

  const metadataStream = pdfDoc.context.stream(Buffer.from(xmpContent, 'utf8'), {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);
  console.log('[PDF] XMP injecté avec succès.');
}

async function injectOutputIntent(pdfDoc) {
  console.log('[PDF] Injection de l\'OutputIntent sRGB...');
  const iccBytes = fs.readFileSync(SRGB_PROFILE);
  const iccStream = pdfDoc.context.flateStream(iccBytes, {
    N: 3,
    Alternate: PDFName.of('DeviceRGB'),
  });
  const iccRef = pdfDoc.context.register(iccStream);

  const outputIntentDict = pdfDoc.context.obj({
    Type: PDFName.of('OutputIntent'),
    S: PDFName.of('GTS_PDFA1'),
    OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'),
    Info: PDFString.of('sRGB IEC61966-2.1'),
    DestOutputProfile: iccRef,
  });

  const outputIntentRef = pdfDoc.context.register(outputIntentDict);
  pdfDoc.catalog.set(
    PDFName.of('OutputIntents'),
    pdfDoc.context.obj([outputIntentRef])
  );

  console.log('[PDF] OutputIntent sRGB injecté avec succès.');
}

function injectPdfID(pdfDoc) {
  const id1 = Buffer.from(crypto.randomBytes(16)).toString('hex');
  const id2 = Buffer.from(crypto.randomBytes(16)).toString('hex');

  const idArray = pdfDoc.context.obj([
    PDFString.of(id1),
    PDFString.of(id2),
  ]);

  pdfDoc.catalog.set(PDFName.of('ID'), idArray);
  console.log(`✅ /ID injecté dans le catalogue PDF : [<${id1}> <${id2}>]`);
}

async function embedFacturXInPdf(pdfPath, facturxPath, attachments = [], invoiceId) {
  ensurePdfDirExists();

  console.log(`[PDF] Chargement du PDF original : ${pdfPath}`);
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  console.log('[PDF] PDF chargé.');

  // Attacher le XML Factur-X
  console.log('[PDF] Ajout du fichier Factur-X XML...');
  const xmlBytes = fs.readFileSync(facturxPath);
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', { mimeType: 'text/xml', description: 'Factur-X XML' });
  console.log('[PDF] Factur-X XML attaché.');

  // Attacher les fichiers supplémentaires
  for (const att of attachments) {
    console.log(`[PDF] Attachement du fichier supplémentaire : ${att.file_name}`);
    const fileBytes = fs.readFileSync(att.file_path);
    await pdfDoc.attach(fileBytes, att.file_name, {
      mimeType: att.mimeType || 'application/octet-stream',
      description: 'Additional attachment',
    });
  }

  // Métadonnées PDF
  console.log('[PDF] Mise à jour des métadonnées PDF...');
  pdfDoc.setTitle(`Invoice ${invoiceId}`);
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X et attachments');
  pdfDoc.setCreator('eInvoicing');
  pdfDoc.setProducer('eInvoicing');

  // Injection XMP et OutputIntent
  injectXmpToPdfLib(pdfDoc, { invoiceId, title: `Invoice ${invoiceId}` });
  await injectOutputIntent(pdfDoc);

  // Sauvegarde temporaire avant qpdf
  const pdfA3Path = path.join(PDF_A3_DIR, `${invoiceId}_pdf-a3.pdf`);
  let finalPdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfA3Path, finalPdfBytes);
  console.log(`[PDF] PDF temporaire sauvegardé : ${pdfA3Path}`);

  // Patch post-process
  console.log('[PDF] Application du patch post-process pour AFRelationship / EF...');
  patchPdfA3(pdfA3Path, 'factur-x.xml');

  // Décompression et linearisation pour corriger endstream et trailer
  const uncompressedPath = uncompressPdf(pdfA3Path);
  fs.copyFileSync(uncompressedPath, pdfA3Path); // remplacer le PDF d'origine
  linearizePdf(pdfA3Path);

  // Injection finale du /ID après qpdf
  const finalPdfDoc = await PDFDocument.load(fs.readFileSync(pdfA3Path));
  injectPdfID(finalPdfDoc);
  finalPdfBytes = await finalPdfDoc.save();
  fs.writeFileSync(pdfA3Path, finalPdfBytes);

  console.log(`✅ PDF/A-3 final prêt avec /ID intact : ${pdfA3Path}`);
  return pdfA3Path;
}

module.exports = { embedFacturXInPdf, PDF_A3_DIR };
