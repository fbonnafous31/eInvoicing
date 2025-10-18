// utils/xmp-helper-corrected.js
const { PDFName } = require('pdf-lib');

/**
 * Échappe les caractères XML spéciaux et accentués pour PDF/A
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/é/g, '&#233;')
    .replace(/è/g, '&#232;')
    .replace(/à/g, '&#224;')
    .replace(/ô/g, '&#244;')
    .replace(/ê/g, '&#234;')
    .replace(/ç/g, '&#231;')
    .replace(/ë/g, '&#235;')
    .replace(/ï/g, '&#239;');
}

/**
 * Génère un XMP PDF/A-3 + Factur-X strict et validable
 */
function generateXmpContent({ invoiceId, xmlFileName, title }) {
  const now = new Date().toISOString();

  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="pdf-lib xmp helper">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
      xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
      xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:xapMM="http://ns.adobe.com/xap/1.0/mm/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">

      <!-- Identifiant PDF/A -->
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>

      <!-- Métadonnées principales -->
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <xmp:CreatorTool>eInvoicing</xmp:CreatorTool>
      <xapMM:DocumentID>INV-${escapeXml(invoiceId.toString())}</xapMM:DocumentID>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml('Facture électronique avec Factur-X')}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:format>application/pdf</dc:format>

      <!-- Métadonnées Factur-X -->
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>${escapeXml(xmlFileName)}</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>

      <!-- Déclaration du schéma d’extension -->
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>

                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Type de document Factur-X (INVOICE)</pdfaProperty:description>
                </rdf:li>

                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Nom du fichier XML intégré</pdfaProperty:description>
                </rdf:li>

                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Version du standard Factur-X</pdfaProperty:description>
                </rdf:li>

                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Niveau de conformité du document</pdfaProperty:description>
                </rdf:li>

              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>

    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Injection XMP dans PDFLib
 */
function injectXmpToPdfLib(pdfDoc, { invoiceId, xmlFileName, title }) {
  const xmpContent = generateXmpContent({ invoiceId, xmlFileName, title });
  const metadataStream = pdfDoc.context.stream(Buffer.from(xmpContent, 'utf8'), {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);
  return metadataRef;
}

module.exports = { generateXmpContent, injectXmpToPdfLib };
