const { execFile } = require('child_process');
const path = require('path');

/**
 * Injecte un fichier XMP complet dans un PDF, en place (overwrite_original).
 * @param {string} pdfPath
 * @param {string} xmpPath
 * @returns {Promise<void>}
 */
function injectXmpIntoPdf(pdfPath, xmpPath) {
  return new Promise((resolve, reject) => {
    const absPdf = path.resolve(pdfPath);
    const absXmp = path.resolve(xmpPath);

    execFile(
      'exiftool',
      ['-tagsFromFile', absXmp, '-overwrite_original', absPdf],
      (error, stdout, stderr) => {
        if (error) {
          const msg = (stderr || error.message || '').trim();
          return reject(new Error(`exiftool a échoué: ${msg}`));
        }
        // exiftool crée parfois un .pdf_original, mais pas avec -overwrite_original
        resolve();
      }
    );
  });
}

module.exports = { injectXmpIntoPdf };
