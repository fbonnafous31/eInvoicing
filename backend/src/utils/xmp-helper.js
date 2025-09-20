// utils/xmp-helper.js
const { PDFName } = require('pdf-lib');

/**
 * Génère un XMP complet pour Factur-X / PDF/A-3
 * @param {Object} options
 * @param {string|number} options.invoiceId
 * @param {string} options.xmlFileName
 * @param {string} options.title
 * @returns {string} XMP prêt à injecter dans le PDF
 */
function generateXmpContent({ invoiceId, xmlFileName, title }) {
  const now = new Date().toISOString();
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:xapMM="http://ns.adobe.com/xap/1.0/mm/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        pdfaid:part="3"
        pdfaid:conformance="B"
        fx:DocumentType="INVOICE"
        fx:DocumentFileName="${xmlFileName}"
        fx:Version="1.0"
        fx:ConformanceLevel="BASIC">
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <xmp:CreatorTool>eInvoicing</xmp:CreatorTool>
      <xapMM:DocumentID>INV-${invoiceId}</xapMM:DocumentID>
      <dc:title>
        <rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt>
      </dc:title>
      <dc:description>Facture électronique avec Factur-X</dc:description>
      <dc:format>application/pdf</dc:format>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Crée un stream PDF pour injection dans le catalogue du PDF/A-3
 * @param {PDFDocument} pdfDoc
 * @param {Object} options
 * @param {string|number} options.invoiceId
 * @param {string} options.xmlFileName
 * @param {string} options.title
 * @returns {PDFRef} La référence à utiliser pour pdfDoc.catalog.set(PDFName.of('Metadata'), ...)
 */
function injectXmpToPdfLib(pdfDoc, { invoiceId, xmlFileName, title }) {
  const xmpContent = generateXmpContent({ invoiceId, xmlFileName, title });
  const metadataStream = pdfDoc.context.stream(xmpContent, {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);
  return metadataRef;
}

module.exports = { generateXmpContent, injectXmpToPdfLib };
