// utils/pdf-postprocess.js
const fs = require('fs');
const crypto = require('crypto');

/**
 * Patch AFRelationship et trailer /ID pour PDF/A-3
 * @param {string} pdfPath - Chemin du PDF à corriger
 * @param {string} facturxName - Nom du fichier Factur-X (ex: factur-x.xml)
 */
function patchPdfA3(pdfPath, facturxName = 'factur-x.xml') {
  let data = fs.readFileSync(pdfPath);
  let text = data.toString('latin1'); // préserve les octets originaux

  let modified = false;

  // --- 1) Patch AFRelationship ---
  const filespecRegex = /\/Type\s*\/Filespec\s*\/F\s*\((.*?)\)/g;
  let match;

  while ((match = filespecRegex.exec(text)) !== null) {
    const fileName = match[1];
    const afterMatchIndex = match.index + match[0].length;
    const afterSlice = text.slice(afterMatchIndex, afterMatchIndex + 80);

    if (!/\/AFRelationship/.test(afterSlice)) {
      const relation =
        fileName === facturxName ? '/AFRelationship /Source' : '/AFRelationship /Data';
      text =
        text.slice(0, afterMatchIndex) +
        `\n${relation}` +
        text.slice(afterMatchIndex);
      modified = true;
      console.log(`✅ AFRelationship ajouté pour ${fileName}`);
      filespecRegex.lastIndex += relation.length;
    }
  }

  // --- 2) Patch trailer /ID ---
  if (!/trailer[\s\r\n]*<<[^>]*\/ID/.test(text)) {
    const id1 = crypto.randomBytes(16).toString('hex');
    const id2 = crypto.randomBytes(16).toString('hex');

    // Insérer le /ID dans le trailer principal
    text = text.replace(/trailer\s*<<([\s\S]*?)>>/, (match, inner) => {
      return `trailer\n<<${inner}\n/ID [<${id1}> <${id2}>] >>`;
    });

    modified = true;
    console.log(`✅ /ID ajouté dans le trailer`);
  } else {
    console.log(`⚠️ Trailer contient déjà un /ID`);
  }

  // --- 3) Sauvegarde ---
  if (modified) {
    fs.writeFileSync(pdfPath, Buffer.from(text, 'latin1'));
    console.log(`✅ PDF patché avec succès`);
  } else {
    console.log(`ℹ️ Aucun patch nécessaire`);
  }
}

module.exports = { patchPdfA3 };
