const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const pdfParse = require('pdf-parse');
const FileType = require('file-type');
const { execFile } = require('child_process');

// -------------------------
// Dossiers
// -------------------------
const tmpDir = path.join(__dirname, '../uploads/tmp');
const finalDir = path.join(__dirname, '../uploads/invoices');
[tmpDir, finalDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// -------------------------
// Storage temporaire Multer
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const cleanName = sanitize(file.originalname.replace(/\s+/g, '_'));
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

// -------------------------
// Limites et filtre Multer avec double extension check
// -------------------------
const fileFilter = async (req, file, cb) => {
  const name = file.originalname;
  if (!/\.pdf$/i.test(name) || /\.pdf\.[^.]+$/i.test(name)) {
    return cb(new Error('Extension non autorisée ou double extension détectée'), false);
  }
  cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 Mo

// -------------------------
// Middleware Multer de base
// -------------------------
const upload = multer({ storage, fileFilter, limits });

// -------------------------
// Scanner PDF pour JS / actions + AcroForm
// -------------------------
async function isPdfSafe(filePath) {
  const buf = fs.readFileSync(filePath);
  const pdfData = await pdfParse(buf);

  const content = pdfData.text || '';
  const unsafePatterns = [/\/JavaScript/, /\/JS/, /\/AA/, /\/OpenAction/, /\/AcroForm/];
  return !unsafePatterns.some(pattern => pattern.test(content));
}

// -------------------------
// Vérification MIME réel
// -------------------------
async function validateMime(filePath) {
  const ft = await FileType.fromFile(filePath);
  if (!ft || ft.mime !== 'application/pdf') {
    throw new Error('MIME incorrect : ce n’est pas un PDF');
  }
}

// -------------------------
// Vérification intégrité QPDF (optionnel si binaire installé)
// -------------------------
function validateWithQpdf(filePath) {
  return new Promise((resolve, reject) => {
    execFile('qpdf', ['--check', filePath], { timeout: 3000 }, (err) => {
      if (err) return reject(new Error('PDF corrompu ou dangereux'));
      resolve(true);
    });
  });
}

// -------------------------
// Anti PDF bomb / fichiers massifs
// -------------------------
function checkPdfForBomb(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size > 8 * 1024 * 1024 || stats.size < 50 * 1024) {
    throw new Error('PDF suspect ou trop volumineux');
  }
}

// -------------------------
// Déplacement fichier vers final
// -------------------------
function moveFile(filePath, targetDir = finalDir) {
  const fileName = path.basename(filePath);
  const finalPath = path.join(targetDir, fileName);
  fs.renameSync(filePath, finalPath);
  return finalPath;
}

// -------------------------
// Wrapper sécurisé multi-fichiers
// -------------------------
function secureUpload(fields) {
  const multiUpload = upload.fields(fields); // Multer multi-fichiers

  return async (req, res, next) => {
    multiUpload(req, res, async err => {
      if (err) {
        // Nettoyage des fichiers temporaires
        if (req.files) {
          Object.values(req.files).flat().forEach(f => fs.unlink(f.path, () => {}));
        }
        return res.status(400).send('Fichier(s) invalide(s) ou trop lourd(s)');
      }

      try {
        if (!req.files) return res.status(400).send('Aucun fichier reçu');

        for (const fileArray of Object.values(req.files)) {
          for (const file of fileArray) {
            const filePath = file.path;

            await validateMime(filePath);
            await validateWithQpdf(filePath);
            checkPdfForBomb(filePath);

            const safe = await isPdfSafe(filePath);
            if (!safe) throw new Error('PDF contient du contenu actif');

            moveFile(filePath);
          }
        }

        next();
      } catch (e) { // eslint-disable-line no-unused-vars
        if (req.files) {
          Object.values(req.files).flat().forEach(f => fs.unlink(f.path, () => {}));
        }
        return res.status(400).send('Fichier(s) dangereux ou invalide(s)');
      }
    });
  };
}

module.exports = { upload, isPdfSafe, moveFile, secureUpload };
