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
 * Transforme un PDF existant en PDF/A-3 avec le XML Factur-X attaché
 * @param {string} pdfPath - Chemin vers le PDF principal existant
 * @param {string} facturxPath - Chemin vers le XML Factur-X
 * @returns {string} Chemin du PDF/A-3 généré
 */
async function embedFacturXInPdf(pdfPath, facturxPath) {
  // 1️⃣ Charger PDF existant
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // 2️⃣ Attacher le XML
  const xmlBytes = fs.readFileSync(facturxPath);
  await pdfDoc.attach(xmlBytes, path.basename(facturxPath), {
    mimeType: 'application/xml',
    description: 'Factur-X XML',
  });

  // 3️⃣ Ajouter métadonnées PDF/A-3 simples
  pdfDoc.setTitle(path.basename(pdfPath));
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X');

  // 4️⃣ Sauvegarder dans pdf-a3
  ensurePdfDirExists();
  const pdfA3Path = path.join(PDF_A3_DIR, path.basename(pdfPath));
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfA3Path, pdfBytes);

  return pdfA3Path;
}

module.exports = { embedFacturXInPdf, PDF_A3_DIR };
