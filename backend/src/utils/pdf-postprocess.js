// utils/pdf-postprocess.js
const fs = require('fs');
const crypto = require('crypto');

/**
 * Patch PDF/A-3 pour :
 *  - AFRelationship pour les fichiers attachés
 *  - EF (EmbeddedFile) pour la référence dans le PDF
 *  - trailer /ID
 *  - Subtype des fichiers attachés (MIME type)
 *  - Params /ModDate manquant
 * @param {string} pdfPath - Chemin du PDF à corriger
 * @param {string} facturxName - Nom du fichier Factur-X (ex: factur-x.xml)
 */
function patchPdfA3(pdfPath, facturxName = 'factur-x.xml') {
  let data = fs.readFileSync(pdfPath);
  let text = data.toString('latin1'); // préserve les octets originaux
  let modified = false;

  // --- 1) Patch AFRelationship et EF ---
  const filespecRegex = /\/Type\s*\/Filespec\s*\/F\s*\((.*?)\)/g;
  let match;
  while ((match = filespecRegex.exec(text)) !== null) {
    const fileName = match[1];
    const afterMatchIndex = match.index + match[0].length;
    const afterSlice = text.slice(afterMatchIndex, afterMatchIndex + 300);

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
      const efRef = '/F 5 0 R'; // placeholder, remplacé par la réf correcte au besoin
      text =
        text.slice(0, afterMatchIndex) +
        `\n/EF << ${efRef} >>` +
        text.slice(afterMatchIndex);
      modified = true;
      console.log(`✅ /EF ajouté pour ${fileName}`);
      filespecRegex.lastIndex += efRef.length;
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

  // --- 3) Patch EmbeddedFile /Subtype manquant ---
  const embeddedFileRegex1 = /\/Type\s*\/EmbeddedFile(?![\s\S]{0,300}?\/Subtype)/gi;
  let efMatch1;
  while ((efMatch1 = embeddedFileRegex1.exec(text)) !== null) {
    const insertPos = efMatch1.index + efMatch1[0].length;

    const nearbySlice = text.slice(Math.max(0, efMatch1.index - 500), efMatch1.index + 500);
    const mime =
      nearbySlice.includes(facturxName)
        ? '(application/xml)'
        : '(application/octet-stream)';

    const subtypeInsert = `\n/Subtype ${mime}`;
    text = text.slice(0, insertPos) + subtypeInsert + text.slice(insertPos);
    modified = true;
    console.log(`✅ Subtype ajouté dans EmbeddedFile ${mime}`);
  }

  // --- 4) Patch EmbeddedFile /Params /ModDate manquant ---
  const embeddedFileRegex2 = /\/Type\s*\/EmbeddedFile/gi;
  let efMatch2;
  while ((efMatch2 = embeddedFileRegex2.exec(text)) !== null) {
    const afterMatchIndex = efMatch2.index + efMatch2[0].length;
    const slice = text.slice(afterMatchIndex, afterMatchIndex + 500);

    if (/\/Params\s*<</.test(slice)) {
      text = text.replace(/(\/Params\s*<<)([\s\S]*?)(>>)/, (m, start, inner, end) => {
        if (/\/ModDate/.test(inner)) return m;
        const modDate = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
        return `${start}${inner}\n/ModDate (D:${modDate})${end}`;
      });
      modified = true;
      console.log(`✅ /ModDate ajouté dans /Params existant`);
    } else {
      const modDate = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
      const insertPos = afterMatchIndex;
      const paramsInsert = `\n/Params << /ModDate (D:${modDate}) >>`;
      text = text.slice(0, insertPos) + paramsInsert + text.slice(insertPos);
      modified = true;
      console.log(`✅ /Params avec /ModDate créé`);
    }
  }

  // --- 5) Sauvegarde ---
  if (modified) {
    fs.writeFileSync(pdfPath, Buffer.from(text, 'latin1'), { flag: 'w' });
    console.log(`✅ PDF patché avec succès`);
  } else {
    console.log(`ℹ️ Aucun patch nécessaire`);
  }
}

module.exports = { patchPdfA3 };
