// utils/xmp-helper.js
const fs = require('fs');
const path = require('path');

/**
 * Génère un fichier XMP complet pour Factur-X, prêt à injecter dans le PDF
 * @param {Object} options
 * @param {string|number} options.invoiceId - ID de la facture
 * @param {string} options.xmlFileName - Nom du XML Factur-X (ex: "174-factur-x.xml")
 * @param {string} options.title - Titre de la facture (ex: "Invoice 174")
 * @returns {string} Chemin vers le fichier XMP temporaire généré
 */
function generateFilledXmp({ invoiceId, xmlFileName, title }) {
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:fx="urn:factur-x:pdfa:metadata:fx"
        pdfaid:part="3"
        pdfaid:conformance="B"
        fx:DocumentType="INVOICE"
        fx:DocumentFileName="${xmlFileName}"
        fx:Version="1.0"
        fx:ConformanceLevel="BASIC"/>
    <rdf:Description
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmp:CreateDate="${now}"
        xmp:ModifyDate="${now}"
        xmp:CreatorTool="eInvoicing"/>
    <rdf:Description
        xmlns:xapMM="http://ns.adobe.com/xap/1.0/mm/"
        xapMM:DocumentID="INV-${invoiceId}"/>
    <rdf:Description
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        dc:title="${title}"
        dc:description="Facture électronique avec Factur-X"
        dc:format="application/pdf"/>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  // Créer un fichier temporaire XMP
  const tmpXmpPath = path.join(__dirname, `${invoiceId}-factur-x.xmp`);
  fs.writeFileSync(tmpXmpPath, xmpContent, 'utf8');

  return tmpXmpPath;
}

module.exports = { generateFilledXmp };
