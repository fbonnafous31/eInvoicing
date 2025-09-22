// utils/pdf-postprocess.js
const fs = require('fs');
const crypto = require('crypto');

/**
 * Patch PDF/A-3 pour :
 *  - AFRelationship pour les fichiers attachés
 *  - EF (EmbeddedFile) pour la référence dans le PDF
 *  - trailer /ID
 *  - Subtype des fichiers attachés (MIME type)
 * @param {string} pdfPath - Chemin du PDF à corriger
 * @param {string} facturxName - Nom du fichier Factur-X (ex: factur-x.xml)
 */
function patchPdfA3(pdfPath, facturxName = 'factur-x.xml') {
  let data = fs.readFileSync(pdfPath);
  let text = data.toString('latin1'); // préserve les octets originaux
  let modified = false;

  // --- 1) Patch AFRelationship et EF avec Subtype ---
  const filespecRegex = /\/Type\s*\/Filespec\s*\/F\s*\((.*?)\)/g;
  let match;
  while ((match = filespecRegex.exec(text)) !== null) {
    const fileName = match[1];
    const afterMatchIndex = match.index + match[0].length;
    const afterSlice = text.slice(afterMatchIndex, afterMatchIndex + 200);

    // AFRelationship
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

    // EF (EmbeddedFile)
    if (!/\/EF\s*<</.test(afterSlice)) {
      const efRef = '/F 5 0 R'; // placeholder
      text =
        text.slice(0, afterMatchIndex) +
        `\n/EF << ${efRef} /Subtype ${fileName === facturxName ? '/text#2Fxml' : '/application#2Foctet-stream'} >>` +
        text.slice(afterMatchIndex);
      modified = true;
      console.log(`✅ /EF avec Subtype ajouté pour ${fileName}`);
      filespecRegex.lastIndex += efRef.length;
    } else {
      // Si /EF existe déjà, ajouter Subtype si absent
      const efSliceMatch = text.slice(afterMatchIndex, afterMatchIndex + 200);
      if (!/\/Subtype/.test(efSliceMatch)) {
        const subTypeInsert =
          fileName === facturxName ? ' /Subtype /text#2Fxml' : ' /Subtype /application#2Foctet-stream';
        const efIndex = afterMatchIndex + efSliceMatch.indexOf('<<') + 2;
        text =
          text.slice(0, efIndex) +
          subTypeInsert +
          text.slice(efIndex);
        modified = true;
        console.log(`✅ Subtype ajouté dans /EF pour ${fileName}`);
      }
    }
  }

  // --- 2) Patch trailer /ID ---
  if (!/trailer[\s\r\n]*<<[^>]*\/ID/.test(text)) {
    const id1 = crypto.randomBytes(16).toString('hex');
    const id2 = crypto.randomBytes(16).toString('hex');

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
