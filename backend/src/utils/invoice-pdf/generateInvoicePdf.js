const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb, PDFName } = require("pdf-lib");
const { paymentMethodsOptions } = require("../../../constants/paymentMethods");
const { paymentTermsOptions } = require("../../../constants/paymentTerms");
const fontkit = require('@pdf-lib/fontkit');

// ---------------- wrapText ----------------
function wrapText(text, font, size, maxWidth) {
  const words = text.replace(/\r?\n/g, ' ').split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatDateFr(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

async function generateInvoicePdf(invoice) {
  console.log("invoice:", invoice);
  const pdfDoc = await PDFDocument.create();

  // --- Début des modifications pour conformité PDF/A ---

  // 1. Enregistrer fontkit pour la gestion des polices .ttf
  pdfDoc.registerFontkit(fontkit);

  // 2. Définir les métadonnées XMP pour l'identification PDF/A-3B
const now = new Date();
const nowIso = now.toISOString();
const title = `Facture ${invoice.invoice_number || invoice.id}`;
const author = invoice.seller?.legal_name || 'eInvoicing App';
// Le nom du fichier XML est requis pour les métadonnées Factur-X
const xmlFileName = "factur-x.xml";

const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <!-- Dublin Core -->
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>
      <!-- XMP Basic -->
      <xmp:CreateDate>${nowIso}</xmp:CreateDate>
      <xmp:ModifyDate>${nowIso}</xmp:ModifyDate>
      <xmp:CreatorTool>eInvoicing App</xmp:CreatorTool>
      <!-- PDF/A ID -->
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <!-- Factur-X -->
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>${xmlFileName}</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const metadataStream = pdfDoc.context.stream(xmpMetadata, {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });

  pdfDoc.catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(metadataStream));

  // 3. Ajouter un "OutputIntent" pour la gestion des couleurs (corrige l'erreur DeviceRGB)
  const iccProfilePath = path.join(__dirname, "color-profiles/sRGB_IEC61966-2-1_black_scaled.icc");
  if (fs.existsSync(iccProfilePath)) {
    const iccProfileBytes = fs.readFileSync(iccProfilePath);
    const outputIntent = pdfDoc.context.stream(iccProfileBytes);
    pdfDoc.catalog.set(
      PDFName.of('OutputIntents'),
      pdfDoc.context.obj([{
        Type: 'OutputIntent', S: 'GTS_PDFA1',
        OutputConditionIdentifier: 'sRGB IEC61966-2.1',
        DestOutputProfile: outputIntent,
      }])
    );
  } else {
    console.warn("Profil ICC manquant pour la conformité PDF/A. Le PDF généré ne sera pas conforme.");
  }

  // 4. Synchroniser le dictionnaire d'informations du document
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  pdfDoc.setCreator('eInvoicing App');
  pdfDoc.setProducer('pdf-lib');
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  // Polices
  // 5. Embarquer les polices pour la conformité PDF/A (corrige l'erreur sur les polices non-embarquées)
  const fontPath = path.join(__dirname, "fonts/DejaVuSans.ttf");
  const fontBoldPath = path.join(__dirname, "fonts/DejaVuSans-Bold.ttf");

  if (!fs.existsSync(fontPath) || !fs.existsSync(fontBoldPath)) {
    console.error("Fichiers de police manquants ! Assurez-vous que DejaVuSans.ttf et DejaVuSans-Bold.ttf existent dans le dossier 'src/utils/invoice-pdf/fonts/'.");
    throw new Error("Fichiers de police requis pour la génération de PDF non trouvés.");
  }

  const fontBytes = fs.readFileSync(fontPath);
  const fontBoldBytes = fs.readFileSync(fontBoldPath);
  const fontRegular = await pdfDoc.embedFont(fontBytes, { subset: true });
  const fontBold = await pdfDoc.embedFont(fontBoldBytes, { subset: true });

  // --- Fin des modifications pour conformité PDF/A ---

  const margin = 50;

  // ---------------- Logo ----------------
  const logoPath = path.join(__dirname, "logo.png");
  const logoWidthMax = 120 * 2.5; // largeur max multipliée par 2.5
  const logoHeightMax = 60 * 2.5; // hauteur max multipliée par 2.5

  let logoHeight = 0;
  let yLogoTop = height - margin;

  if (fs.existsSync(logoPath)) {
    // NOTE: Pour éviter les problèmes de transparence (erreur SMask), assurez-vous que votre logo.png n'a pas de canal alpha.
    const logoBytes = await fs.promises.readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(1);
    const ratio = Math.min(logoWidthMax / logoDims.width, logoHeightMax / logoDims.height);
    const logoWidth = logoDims.width * ratio;
    logoHeight = logoDims.height * ratio;

    page.drawImage(logoImage, {
      x: margin,
      y: yLogoTop - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    // fallback rectangle si pas de logo
    logoHeight = 50;
    page.drawRectangle({
      x: margin,
      y: yLogoTop - logoHeight,
      width: 100,
      height: logoHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    page.drawText("LOGO", {
      x: margin + 25,
      y: yLogoTop - 35,
      size: 12,
      font: fontBold,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // ---------------- Seller (haut droite, aligné top logo) ----------------
  const blockWidth = 220;
  const seller = invoice.seller || {};
  let sellerText = "";
  if (seller.legal_name) sellerText += `${seller.legal_name}\n`;
  if (seller.address) sellerText += `${seller.address}\n`;
  if (seller.postal_code || seller.city)
    sellerText += `${seller.postal_code || ""} ${seller.city || ""}\n`;
  if (seller.phone_number) sellerText += `Tel: ${seller.phone_number}\n`;
  if (seller.contact_email) sellerText += `Email: ${seller.contact_email}\n`;
  if (seller.legal_identifier) sellerText += `SIRET: ${seller.legal_identifier}\n`;
  if (seller.vat_number) sellerText += `TVA: ${seller.vat_number}\n`;

  const sellerLines = sellerText.split("\n").filter(Boolean);
  let sellerY = yLogoTop - 40; 
  sellerLines.forEach((line, i) => {
    const font = i === 0 ? fontBold : fontRegular;
    page.drawText(line, {
      x: width - margin - blockWidth,
      y: sellerY,
      size: 10,
      font,
    });
    sellerY -= 12;
  });

  // ---------------- Client (sous logo) ----------------
  const client = invoice.client || {};
  let clientText = "";
  if (client.legal_name) clientText += `${client.legal_name}\n`;
  if (client.address) clientText += `${client.address}\n`;
  if (client.postal_code || client.city)
    clientText += `${client.postal_code || ""} ${client.city || ""}\n`;
  if (client.phone) clientText += `Tel: ${client.phone}\n`;
  if (client.email) clientText += `Email: ${client.email}\n`;
  if (client.legal_identifier && /^\d{14}$/.test(client.legal_identifier))
    clientText += `SIRET: ${client.legal_identifier}\n`;
  if (client.vat_number) clientText += `TVA: ${client.vat_number}\n`;

  const clientLines = clientText.split("\n").filter(Boolean);
  let clientY = yLogoTop - logoHeight - 10; // juste sous le logo
  clientLines.forEach((line, i) => {
    const font = i === 0 ? fontBold : fontRegular;
    page.drawText(line, {
      x: margin,
      y: clientY,
      size: 10,
      font,
    });
    clientY -= 12;
  });

  // ---------------- Position du reste du contenu ----------------
  let y = Math.min(sellerY, clientY) - 20;

  // ---------------- Dates & infos facture ----------------
  if (invoice.invoice_number) {
    page.drawText(`Référence facture : ${invoice.invoice_number}`, {
      x: margin,
      y,
      size: 10,
      font: fontBold,
    });
  }
  y -= 20;

  if (invoice.issue_date)
    page.drawText(`Date d'émission : ${formatDateFr(invoice.issue_date)}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });

  if (invoice.supply_date)
    page.drawText(`Date de livraison : ${formatDateFr(invoice.supply_date)}`, {
      x: margin + 200,
      y,
      size: 10,
      font: fontRegular,
    });

  y -= 50;

  // ---------------- Tableau des lignes ----------------
  const tableX = margin;
  let tableY = y;
  const tableWidth = width - 2 * margin;
  const colWidths = [150, 40, 60, 60, 70, 70, 70];
  const rowHeight = 20;

  // Header
  page.drawRectangle({
    x: tableX,
    y: tableY - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  let xCursor = tableX;
  const headers = ["Description", "Qté", "PU", "Taux TVA", "HT", "TVA", "TTC"];
  headers.forEach((h, i) => {
    page.drawText(h, {
      x: xCursor + 5,
      y: tableY - 15,
      size: 9,
      font: fontBold,
    });
    xCursor += colWidths[i];
  });

  tableY -= rowHeight;

  // Rows
  invoice.lines?.forEach((line) => {
    xCursor = tableX;
    const rowValues = [
      line.description || "",
      line.quantity || "",
      `${line.unit_price || ""} €`,
      line.vat_rate ? `${line.vat_rate}%` : "",
      line.line_net ? `${line.line_net} €` : "",
      line.line_tax ? `${line.line_tax} €` : "",
      line.line_total ? `${line.line_total} €` : "",
    ];

    page.drawRectangle({
      x: tableX,
      y: tableY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    rowValues.forEach((text, i) => {
      page.drawText(text.toString(), {
        x: xCursor + 5,
        y: tableY - 15,
        size: 9,
        font: fontRegular,
      });
      xCursor += colWidths[i];
    });

    tableY -= rowHeight;
  });

  y = tableY - 20;

  // ---------------- Totaux ----------------
  const totalLabels = ["Sous-total", "Total TVA", "Total TTC"];
  const totalValues = [
    invoice.subtotal ? `${invoice.subtotal} €` : "",
    invoice.total_taxes ? `${invoice.total_taxes} €` : "",
    invoice.total ? `${invoice.total} €` : "",
  ];

  const boxWidth = 180;
  const boxHeight = totalLabels.length * 20;
  const totalsX = width - margin - boxWidth;
  let totalsY = y;

  page.drawRectangle({
    x: totalsX,
    y: totalsY - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  totalsY -= 15;
  totalLabels.forEach((label, i) => {
    page.drawText(label, {
      x: totalsX + 15,
      y: totalsY,
      size: 10,
      font: fontBold,
    });
    page.drawText(totalValues[i].toString(), {
      x: totalsX + boxWidth - 70,
      y: totalsY,
      size: 10,
      font: fontRegular,
    });
    totalsY -= 20;
  });
  y = totalsY - 30;

  // ---------------- Informations de paiement ----------------
  if (invoice.seller?.payment_method) {
    // Cherche le libellé correspondant à la méthode de paiement
    const paymentMethodOption = paymentMethodsOptions.find(
      (opt) => opt.value === invoice.seller?.payment_method
    );
    const paymentMethodLabel = paymentMethodOption
      ? paymentMethodOption.label
      : invoice.seller?.payment_method;

    page.drawText(`Moyen de paiement : ${paymentMethodLabel}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });
    y -= 15;

    // 👉 IBAN + BIC si virement bancaire
    if (invoice.seller?.payment_method === "bank_transfer") {
      if (seller.iban) {
        page.drawText(`IBAN : ${seller.iban}`, {
          x: margin,
          y,
          size: 10,
          font: fontRegular,
        });
        y -= 15;
      }
      if (seller.bic) {
        page.drawText(`BIC : ${seller.bic}`, {
          x: margin,
          y,
          size: 10,
          font: fontRegular,
        });
        y -= 15;
      }
    }  
  }

  if (invoice.seller?.payment_terms) {
    const termsLabel = paymentTermsOptions.find(t => t.value === invoice.seller.payment_terms)?.label || invoice.seller.payment_terms;
    page.drawText(`Conditions de paiement : ${termsLabel}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });
    y -= 25;
  }
  
  // ---------------- Mentions additionnelles ----------------
    const mentions = [invoice.seller?.additional_1, invoice.seller?.additional_2].filter(Boolean);
    const maxWidth = 595 - 2 * margin; // largeur de la page moins marges

    mentions.forEach(mention => {
      const wrappedLines = wrapText(mention, fontRegular, 9, maxWidth);
      wrappedLines.forEach(line => {
        if (y < 50) {
          page.addPage([595, 842]); // nouvelle page
          y = 842 - margin;
        }
        page.drawText(line, { x: margin, y, size: 9, font: fontRegular });
        y -= 12;
      });
      y -= 10;
    });

  // ---------------- Save ----------------
  const uploadDir = path.join(__dirname, "../../uploads/pdf");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, `${invoice.id}_invoice.pdf`);
  const pdfBytes = await pdfDoc.save();
  await fs.promises.writeFile(filePath, pdfBytes);

  console.log("Écriture du PDF :", filePath);
  return filePath;
}

async function generateInvoicePdfBuffer(invoice) {
  const pdfDoc = await PDFDocument.create();

  // --- Début des modifications pour conformité PDF/A ---

  // 1. Enregistrer fontkit pour la gestion des polices .ttf
  pdfDoc.registerFontkit(fontkit);

  // 2. Définir les métadonnées XMP pour l'identification PDF/A-3B
  const now = new Date();
  const nowIso = now.toISOString();
  const title = `Facture ${invoice.header?.invoice_number || 'Preview'}`;
  const author = invoice.seller?.legal_name || 'eInvoicing App';

  // Le nom du fichier XML est requis pour les métadonnées Factur-X
  const xmlFileName = "factur-x.xml";

  // --- Définir les métadonnées XMP correctement pour PDF/A-3 et Factur-X ---
  const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
  <x:xmpmeta xmlns:x="adobe:ns:meta/">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about=""
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:xmp="http://ns.adobe.com/xap/1.0/"
          xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
          xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
        <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
        <dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>
        <xmp:CreateDate>${nowIso}</xmp:CreateDate>
        <xmp:ModifyDate>${nowIso}</xmp:ModifyDate>
        <xmp:CreatorTool>eInvoicing App</xmp:CreatorTool>
        <pdfaid:part>3</pdfaid:part>
        <pdfaid:conformance>B</pdfaid:conformance>
        <fx:DocumentType>INVOICE</fx:DocumentType>
        <fx:DocumentFileName>${xmlFileName}</fx:DocumentFileName>
        <fx:Version>1.0</fx:Version>
        <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>
      </rdf:Description>
    </rdf:RDF>
  </x:xmpmeta>
  <?xpacket end="w"?>`;

  // Utiliser un flux XML non compressé
  const metadataStream = pdfDoc.context.stream(xmpMetadata, {
    Type: PDFName.of('Metadata'),
    Subtype: PDFName.of('XML'),
  });

  // Enregistrer dans le catalogue PDF
  pdfDoc.catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(metadataStream));

  // 3. Ajouter un "OutputIntent" pour la gestion des couleurs
  const iccProfilePath = path.join(__dirname, "color-profiles/sRGB_IEC61966-2-1_black_scaled.icc");
  if (fs.existsSync(iccProfilePath)) {
    const iccProfileBytes = fs.readFileSync(iccProfilePath);
    const outputIntent = pdfDoc.context.stream(iccProfileBytes);
    pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([{ Type: 'OutputIntent', S: 'GTS_PDFA1', OutputConditionIdentifier: 'sRGB IEC61966-2.1', DestOutputProfile: outputIntent }]));
  }

  // 4. Synchroniser le dictionnaire d'informations du document
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  pdfDoc.setCreator('eInvoicing App');
  pdfDoc.setProducer('pdf-lib');
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();
  const fontPath = path.join(__dirname, "fonts/DejaVuSans.ttf");
  const fontBoldPath = path.join(__dirname, "fonts/DejaVuSans-Bold.ttf");

  if (!fs.existsSync(fontPath) || !fs.existsSync(fontBoldPath)) {
    console.error("Fichiers de police manquants ! Assurez-vous que DejaVuSans.ttf et DejaVuSans-Bold.ttf existent dans le dossier 'src/utils/invoice-pdf/fonts/'.");
    throw new Error("Fichiers de police requis pour la génération de PDF non trouvés.");
  }

  const fontBytes = fs.readFileSync(fontPath);
  const fontBoldBytes = fs.readFileSync(fontBoldPath);
  const fontRegular = await pdfDoc.embedFont(fontBytes, { subset: true });
  const fontBold = await pdfDoc.embedFont(fontBoldBytes, { subset: true });
  const margin = 50;
  let y = height - margin;

  // ---------------- Récupération des données ----------------
  const header = invoice.header || {};
  const client = invoice.client || {};
  const seller = Array.isArray(invoice.seller) && invoice.seller.length > 0 
    ? invoice.seller[0] 
    : (invoice.seller && typeof invoice.seller === "object" ? invoice.seller : {});
  const lines = invoice.lines || [];

  // ---------------- Logo ----------------
  const logoPath = path.join(__dirname, "logo.png");
  let logoHeight = 0;
  // NOTE: Pour éviter les problèmes de transparence (erreur SMask), assurez-vous que votre logo.png n'a pas de canal alpha.
  if (fs.existsSync(logoPath)) {
    const logoBytes = await fs.promises.readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(1);
    const logoWidthMax = 120 * 2.5;
    const logoHeightMax = 60 * 2.5;
    const ratio = Math.min(logoWidthMax / logoDims.width, logoHeightMax / logoDims.height);
    const logoWidth = logoDims.width * ratio;
    logoHeight = logoDims.height * ratio;

    page.drawImage(logoImage, {
      x: margin,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    logoHeight = 50;
    page.drawRectangle({
      x: margin,
      y: y - logoHeight,
      width: 100,
      height: logoHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    page.drawText("LOGO", {
      x: margin + 25,
      y: y - 35,
      size: 12,
      font: fontBold,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const yTop = y;
  y -= logoHeight + 10;

  // ---------------- Seller (haut droite) ----------------
  const blockWidth = 220;
  let sellerText = "";
  if (seller.legal_name) sellerText += `${seller.legal_name}\n`;
  if (seller.address) sellerText += `${seller.address}\n`;
  if (seller.postal_code || seller.city)
    sellerText += `${seller.postal_code || ""} ${seller.city || ""}\n`;
  if (seller.phone_number) sellerText += `Tel: ${seller.phone_number}\n`;
  if (seller.contact_email) sellerText += `Email: ${seller.contact_email}\n`;
  if (seller.legal_identifier) sellerText += `SIRET: ${seller.legal_identifier}\n`;
  if (seller.vat_number) sellerText += `TVA: ${seller.vat_number}\n`;

  const sellerLines = sellerText.split("\n").filter(Boolean);
  let sellerY = yTop - 40;
  sellerLines.forEach((line, i) => {
    const font = i === 0 ? fontBold : fontRegular;
    page.drawText(line, {
      x: width - margin - blockWidth,
      y: sellerY,
      size: 10,
      font,
    });
    sellerY -= 12;
  });

  // ---------------- Client ----------------
  let clientText = "";
  if (client.client_legal_name) clientText += `${client.client_legal_name}\n`;
  if (client.client_address) clientText += `${client.client_address}\n`;
  if (client.client_postal_code || client.client_city)
    clientText += `${client.client_postal_code || ""} ${client.client_city || ""}\n`;
  if (client.client_phone) clientText += `Tel: ${client.client_phone}\n`;
  if (client.client_email) clientText += `Email: ${client.client_email}\n`;
  if (client.client_siret && /^\d{14}$/.test(client.client_siret))
    clientText += `SIRET: ${client.client_siret}\n`;
  if (client.client_vat_number) clientText += `TVA: ${client.client_vat_number}\n`;

  const clientLines = clientText.split("\n").filter(Boolean);
  let clientY = yTop - logoHeight - 10;
  clientLines.forEach((line, i) => {
    const font = i === 0 ? fontBold : fontRegular;
    page.drawText(line, { x: margin, y: clientY, size: 10, font });
    clientY -= 12;
  });

  // ---------------- Dates & infos facture ----------------
  y = Math.min(sellerY, clientY) - 20;

  if (header.invoice_number)
    page.drawText(`Référence facture : ${header.invoice_number}`, {
      x: margin,
      y,
      size: 10,
      font: fontBold,
    });
  y -= 20;

  if (header.issue_date)
    page.drawText(`Date d'émission : ${formatDateFr(header.issue_date)}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });

  if (header.supply_date)
    page.drawText(`Date de livraison : ${formatDateFr(header.supply_date)}`, {
      x: margin + 200,
      y,
      size: 10,
      font: fontRegular,
    });
  y -= 40;

  // ---------------- Lignes ----------------
  const tableX = margin;
  let tableY = y;
  const tableWidth = width - 2 * margin;
  const colWidths = [150, 40, 60, 60, 70, 70, 70];
  const rowHeight = 20;

  // Header du tableau
  page.drawRectangle({
    x: tableX,
    y: tableY - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  const headers = ["Description", "Qté", "PU", "Taux TVA", "HT", "TVA", "TTC"];
  let xCursor = tableX;
  headers.forEach((h, i) => {
    page.drawText(h, { x: xCursor + 5, y: tableY - 15, size: 9, font: fontBold });
    xCursor += colWidths[i];
  });

  tableY -= rowHeight;

  // Rows
  lines.forEach((line) => {
    xCursor = tableX;
    const rowValues = [
      line.description || "",
      line.quantity || "",
      `${line.unit_price || ""} €`,
      line.vat_rate ? `${line.vat_rate}%` : "",
      line.line_net ? `${line.line_net} €` : "",
      line.line_tax ? `${line.line_tax} €` : "",
      line.line_total ? `${line.line_total} €` : "",
    ];

    page.drawRectangle({
      x: tableX,
      y: tableY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    rowValues.forEach((text, i) => {
      page.drawText(text.toString(), { x: xCursor + 5, y: tableY - 15, size: 9, font: fontRegular });
      xCursor += colWidths[i];
    });
    tableY -= rowHeight;
  });

  y = tableY - 20;

  // ---------------- Totaux calculés depuis les lignes ----------------
  let subtotal = 0;
  let totalTaxes = 0;
  let totalTTC = 0;

  invoice.lines?.forEach((line) => {
    const lineNet = parseFloat(line.line_net) || 0;
    const lineTax = parseFloat(line.line_tax) || 0;
    const lineTotal = parseFloat(line.line_total) || 0;

    subtotal += lineNet;
    totalTaxes += lineTax;
    totalTTC += lineTotal;
  });

  // Formattage pour affichage
  const totalLabels = ["Sous-total", "Total TVA", "Total TTC"];
  const totalValues = [
    `${subtotal.toFixed(2)} €`,
    `${totalTaxes.toFixed(2)} €`,
    `${totalTTC.toFixed(2)} €`,
  ];

  // Dessin du bloc récapitulatif sur le PDF
  const boxWidth = 180;
  const boxHeight = totalLabels.length * 20;
  const totalsX = width - margin - boxWidth;
  let totalsY = y;

  page.drawRectangle({
    x: totalsX,
    y: totalsY - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  totalsY -= 15;
  totalLabels.forEach((label, i) => {
    page.drawText(label, { x: totalsX + 15, y: totalsY, size: 10, font: fontBold });
    page.drawText(totalValues[i], { x: totalsX + boxWidth - 70, y: totalsY, size: 10, font: fontRegular });
    totalsY -= 20;
  });

  y = totalsY - 30; 

  // ---------------- Informations de paiement ----------------
  if (header.payment_method) {
    // Cherche le libellé correspondant à la méthode de paiement
    const paymentMethodOption = paymentMethodsOptions.find(
      (opt) => opt.value === header.payment_method
    );
    const paymentMethodLabel = paymentMethodOption
      ? paymentMethodOption.label
      : header.payment_method;

    page.drawText(`Moyen de paiement : ${paymentMethodLabel}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });
    y -= 15;
    console.log("seller:", seller);

    // 👉 IBAN + BIC si virement bancaire
    if (header.payment_method === "bank_transfer") {
      if (seller.iban) {
        page.drawText(`IBAN : ${seller.iban}`, {
          x: margin,
          y,
          size: 10,
          font: fontRegular,
        });
        y -= 15;
      }
      if (seller.bic) {
        page.drawText(`BIC : ${seller.bic}`, {
          x: margin,
          y,
          size: 10,
          font: fontRegular,
        });
        y -= 15;
      }
    }  
  }  

  if (header.payment_terms) {
    // Cherche le libellé correspondant aux conditions de paiement
    const termsLabel = paymentTermsOptions.find(
      (t) => t.value === header.payment_terms
    )?.label || header.payment_terms;

    page.drawText(`Conditions de paiement : ${termsLabel}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });
    y -= 25;
  }

  // ---------------- Mentions additionnelles ----------------
  const mentions = [seller?.additional_1, seller?.additional_2].filter(Boolean);
  const maxWidth = width - 2 * margin;

  mentions.forEach((mention) => {
    const wrappedLines = wrapText(mention, fontRegular, 9, maxWidth);
    wrappedLines.forEach((line) => {
      if (y < 50) {
        // nouvelle page si bas atteint
        page.addPage([595, 842]);
        y = 842 - margin;
      }
      page.drawText(line, { x: margin, y, size: 9, font: fontRegular });
      y -= 12;
    });
    y -= 10;
  });

  // ---------------- Retour PDF bytes ----------------
  const pdfBytes = await pdfDoc.save();
  return pdfBytes; // buffer pour envoyer au front sans écrire sur disque
}

module.exports = { generateInvoicePdf, generateInvoicePdfBuffer };
