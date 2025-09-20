// utils/pdf-postprocess.js
const fs = require('fs');

/**
 * Patch AFRelationship pour le XML Factur-X attaché
 * @param {string} pdfPath - Chemin du PDF à corriger
 * @param {string} xmlFileName - Nom du fichier XML Factur-X attaché (ex: "174-factur-x.xml")
 */
function patchPdfA3(pdfPath, xmlFileName) {
  let data = fs.readFileSync(pdfPath, { encoding: 'utf8' });
  
  // ✅ Forcer AFRelationship /Data pour le XML Factur-X
  // On cherche le fichier XML par son nom
  const xmlRegex = new RegExp(`/Type\\s*/Filespec\\s*/F\\s*\\(${xmlFileName}\\)`);
  if (xmlRegex.test(data)) {
    data = data.replace(xmlRegex, match => `${match}\n/AFRelationship /Data`);
    fs.writeFileSync(pdfPath, data, { encoding: 'utf8' });
    console.log(`✅ AFRelationship ajouté pour ${xmlFileName} dans ${pdfPath}`);
  } else {
    console.warn(`⚠️ XML ${xmlFileName} non trouvé dans ${pdfPath}, AFRelationship non ajouté`);
  }
}

module.exports = { patchPdfA3 };
