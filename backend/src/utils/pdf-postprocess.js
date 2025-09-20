// utils/pdf-postprocess.js
const fs = require('fs');

/**
 * Patch AFRelationship pour tous les fichiers attachés dans un PDF/A-3
 * @param {string} pdfPath - Chemin du PDF à corriger
 */
function patchPdfA3(pdfPath) {
  let data = fs.readFileSync(pdfPath); // Buffer binaire

  // Regex pour trouver chaque fichier attaché : /Type /Filespec suivi de /F (nom)
  const filespecRegex = /\/Type\s*\/Filespec\s*\/F\s*\((.*?)\)/g;

  let match;
  let modified = false;

  while ((match = filespecRegex.exec(data)) !== null) {
    const fullMatch = match[0];
    const fileName = match[1];

    // Vérifier si /AFRelationship déjà présent après le Filespec
    const afterMatchIndex = match.index + fullMatch.length;
    const afterBytes = data.slice(afterMatchIndex, afterMatchIndex + 50).toString();
    if (!/\/AFRelationship/.test(afterBytes)) {
      const insert = Buffer.from(`\n/AFRelationship /Data`);
      data = Buffer.concat([
        data.slice(0, afterMatchIndex),
        insert,
        data.slice(afterMatchIndex),
      ]);
      modified = true;
      console.log(`✅ AFRelationship ajouté pour ${fileName}`);
      // Ajuster l'index pour ne pas passer par-dessus ce qu'on vient d'insérer
      filespecRegex.lastIndex += insert.length;
    }
  }

  if (modified) {
    fs.writeFileSync(pdfPath, data);
    console.log(`✅ PDF patché avec AFRelationship`);
  } else {
    console.log(`⚠️ Aucun Filespec modifié`);
  }
}

module.exports = { patchPdfA3 };
