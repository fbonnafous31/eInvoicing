const fs = require('fs');
const path = require('path');

const PDF_A3_DIR = path.resolve('src/uploads/pdf-a3');
const TEMPLATE_XMP_PATH = path.resolve(__dirname, 'facturx-template.xmp');

/**
 * Remplit le template XMP avec les valeurs dynamiques et renvoie le chemin du .xmp généré.
 * @param {Object} p
 * @param {number|string} p.invoiceId
 * @param {string} p.xmlFileName  ex: "174-factur-x.xml"
 * @param {string} [p.title]      ex: "Invoice 174"
 * @param {string} [p.createDate] ISO string
 * @param {string} [p.modifyDate] ISO string
 * @returns {string} Chemin du fichier XMP généré (dans src/uploads/pdf-a3)
 */
function generateFilledXmp({ invoiceId, xmlFileName, title, createDate, modifyDate }) {
  if (!fs.existsSync(TEMPLATE_XMP_PATH)) {
    throw new Error(`Template XMP introuvable à ${TEMPLATE_XMP_PATH}`);
  }
  if (!fs.existsSync(PDF_A3_DIR)) {
    fs.mkdirSync(PDF_A3_DIR, { recursive: true });
  }

  let xmp = fs.readFileSync(TEMPLATE_XMP_PATH, 'utf-8');

  // Valeurs par défaut
  const now = new Date().toISOString();
  const _title = title || `Invoice ${invoiceId}`;
  const _create = createDate || now;
  const _modify = modifyDate || now;

  // Remplacements basés sur placeholders si présents
  xmp = xmp
    .replace(/--CreateDate--/g, _create)
    .replace(/--ModifyDate--/g, _modify)
    .replace(/--DocumentID--/g, `INV-${invoiceId}`)
    .replace(/--Title--/g, _title);

  // Assurer que fx:DocumentFileName correspond bien au nom du XML attaché
  // (fonctionne même si pas de placeholder, on remplace la valeur existante)
  xmp = xmp.replace(
    /fx:DocumentFileName="[^"]*"/,
    `fx:DocumentFileName="${xmlFileName}"`
  );

  const outPath = path.join(PDF_A3_DIR, `${invoiceId}_temp.xmp`);
  fs.writeFileSync(outPath, xmp, 'utf-8');
  return outPath;
}

module.exports = { generateFilledXmp, PDF_A3_DIR, TEMPLATE_XMP_PATH };
