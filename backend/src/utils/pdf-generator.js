// utils/pdf-generator.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName, PDFString } = require('pdf-lib');
const { patchPdfA3 } = require('./pdf-postprocess');

const PDF_A3_DIR = path.resolve('src/uploads/pdf-a3');

function ensurePdfDirExists() {
  if (!fs.existsSync(PDF_A3_DIR)) {
    fs.mkdirSync(PDF_A3_DIR, { recursive: true });
  }
  return PDF_A3_DIR;
}

/**
 * Injecte un XMP Factur-X dans un PDFDocument pdf-lib
 */
function injectXmpToPdfLib(pdfDoc, { invoiceId, xmlFileName, title }) {
  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
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
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${new Date().toISOString()}</xmp:ModifyDate>
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

  const metadataStream = pdfDoc.context.stream(xmpContent, {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });
  pdfDoc.catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(metadataStream));
}

async function embedFacturXInPdf(pdfPath, facturxPath, attachments = [], invoiceId) {
  // Charger PDF principal
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Attacher le XML Factur-X
  const xmlBytes = fs.readFileSync(facturxPath);
  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'text/xml',
    description: 'Factur-X XML',
  });

  // Attacher les fichiers supplémentaires
  for (const att of attachments) {
    const fileBytes = fs.readFileSync(att.file_path);
    await pdfDoc.attach(fileBytes, att.file_name, {
      mimeType: att.mimeType || 'application/octet-stream',
      description: 'Additional attachment',
    });
  }

  // Métadonnées PDF standards
  pdfDoc.setTitle(`Invoice ${invoiceId}`);
  pdfDoc.setSubject('Facture électronique PDF/A-3 avec Factur-X et attachments');
  pdfDoc.setCreator('eInvoicing');
  pdfDoc.setProducer('eInvoicing');

  // Injection XMP directe
  injectXmpToPdfLib(pdfDoc, {
    invoiceId,
    xmlFileName: path.basename(facturxPath),
    title: `Invoice ${invoiceId}`,
  });

  // Sauvegarde PDF/A-3
  ensurePdfDirExists();
  const pdfA3Path = path.join(PDF_A3_DIR, `${invoiceId}_pdf-a3.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfA3Path, pdfBytes, { encoding: 'binary' });

  // Patch post-process si nécessaire
  patchPdfA3(pdfA3Path, 'factur-x.xml');

  console.log(`✅ PDF/A-3 avec XMP injecté généré à : ${pdfA3Path}`);
  return pdfA3Path;
}

module.exports = { embedFacturXInPdf, PDF_A3_DIR };
