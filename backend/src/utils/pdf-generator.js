// utils/pdf-generator.js
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { generateFilledXmp } = require('./xmp-helper');
const { injectXmpIntoPdf } = require('./xmp-injector');
const { patchPdfA3 } = require('./pdf-postprocess');

const PDF_A3_DIR = path.resolve('src/uploads/pdf-a3');

function ensurePdfDirExists() {
  if (!fs.existsSync(PDF_A3_DIR)) {
    fs.mkdirSync(PDF_A3_DIR, { recursive: true });
  }
  return PDF_A3_DIR;
}

/**
 * Transforme un PDF existant en PDF/A-3 avec le XML Factur-X et les attachments
 * @param {string} pdfPath - Chemin vers le PDF principal existant
 * @param {string} facturxPath - Chemin vers le XML Factur-X
 * @param {Array<{file_path: string, file_name: string, mimeType?: string}>} attachments - Liste des attachments à embarquer
 * @param {string|number} invoiceId - ID de la facture pour nommer le PDF/A-3
 * @returns {string} Chemin du PDF/A-3 généré
 */

async function embedFacturXInPdf(pdfPath, facturxPath, attachments = [], invoiceId) {
  // Charger PDF principal
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Attacher le XML Factur-X
  const xmlBytes = fs.readFileSync(facturxPath);
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'Factur-X XML',
  });

  // Attacher les fichiers supplémentaires
  for (const att of attachments) {
    const fileBytes = fs.readFileSync(att.file_path);
    await pdfDoc.attach(fileBytes, att.file_name, {
      mimeType: att.mimeType || 'application/octet-stream',
      description: 'Additional attachment',
    });
  }

  // Métadonnées PDF standards (compatibles pdf-lib)
  pdfDoc.setTitle(`Invoice ${invoiceId}`);
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X et attachments');
  pdfDoc.setCreator('eInvoicing');
  pdfDoc.setProducer('eInvoicing');

  // Sauvegarder PDF/A-3
  ensurePdfDirExists();
  const pdfA3Path = path.join(PDF_A3_DIR, `${invoiceId}_pdf-a3.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfA3Path, pdfBytes);

  // ✅ Injection XMP avec exiftool (optionnel, non bloquant)
  try {
    const xmlFileName = path.basename(facturxPath); 
    const xmpPath = generateFilledXmp({
      invoiceId,
      xmlFileName,
      title: `Invoice ${invoiceId}`,
    });

    await injectXmpIntoPdf(pdfA3Path, xmpPath);
    patchPdfA3(pdfA3Path, 'factur-x.xml');
    
    // Nettoyer le fichier XMP temporaire
    try { fs.unlinkSync(xmpPath); } catch (_) {}

    console.log(`✅ XMP injecté dans ${pdfA3Path}`);
  } catch (err) {
    console.warn(`⚠️ Impossible d'injecter le XMP (PDF généré quand même): ${err.message}`);
  }

  return pdfA3Path;
}

module.exports = { embedFacturXInPdf, PDF_A3_DIR };
