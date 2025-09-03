const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

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
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Attacher le XML
  const xmlBytes = fs.readFileSync(facturxPath);
  await pdfDoc.attach(xmlBytes, `${invoiceId}-factur-x.xml`, {
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

  // Métadonnées
  pdfDoc.setTitle(`Invoice ${invoiceId}`);
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X et attachments');

  // Sauvegarder PDF/A-3
  ensurePdfDirExists();
  const pdfA3Path = path.join(PDF_A3_DIR, `${invoiceId}_pdf-a3.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfA3Path, pdfBytes);

  return pdfA3Path;
}

module.exports = { embedFacturXInPdf, PDF_A3_DIR };
