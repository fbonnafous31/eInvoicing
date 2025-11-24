const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const pdfParse = require('pdf-parse'); // pour scanner rapidement le PDF

// Dossier de stockage temporaire
const tmpDir = path.join(__dirname, '../uploads/tmp');
const finalDir = path.join(__dirname, '../uploads/invoices');

// Crée les dossiers s’ils n’existent pas
[tmpDir, finalDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage temporaire
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const cleanName = sanitize(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

// Filtre type
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
  }
  cb(null, true);
};

// Limite taille (5 Mo)
const limits = { fileSize: 5 * 1024 * 1024 };

// Middleware multer sécurisé
const upload = multer({ storage, fileFilter, limits });

// Fonction pour scanner le PDF et détecter JS ou actions suspectes
async function isPdfSafe(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);

  const content = pdfData.text;
  // Détection basique de JS / actions
  const unsafePatterns = [/\/JavaScript/, /\/JS/, /\/AA/, /\/OpenAction/];
  return !unsafePatterns.some(pattern => pattern.test(content));
}

// Fonction pour déplacer le fichier vers le dossier final
function moveFile(filePath, finalDir) {
  const fileName = path.basename(filePath);
  const finalPath = path.join(finalDir, fileName);
  fs.renameSync(filePath, finalPath);
  return finalPath;
}

module.exports = { upload, isPdfSafe, moveFile };
