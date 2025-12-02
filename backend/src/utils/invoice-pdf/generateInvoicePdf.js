const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, PDFName } = require("pdf-lib");
const { paymentMethodsOptions } = require("../../../constants/paymentMethods");
const { paymentTermsOptions } = require("../../../constants/paymentTerms");
const fontkit = require('@pdf-lib/fontkit');
const logger = require("../../utils/logger");

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

async function generateQuotePdf(quote) {
  logger.info("quote:", quote);
  const pdfDoc = await PDFDocument.create();
  const ASSETS_PATH = path.join(process.cwd(), "public/pdf-assets");

  // --- Début des modifications pour conformité PDF/A ---

  // 1. Enregistrer fontkit pour la gestion des polices .ttf
  pdfDoc.registerFontkit(fontkit);

  // 2. Définir les métadonnées XMP pour l'identification PDF/A-3B
  const now = new Date();
  const nowIso = now.toISOString();
  const title = `Devis ${quote.invoice_number || quote.id}`;
  const author = quote.seller?.legal_name || 'eInvoicing App';
  // Le nom du fichier XML est requis pour les métadonnées Factur-X
  const xmlFileName = "factur-x.xml";

  const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
  <x:xmpmeta xmlns:x="adobe:ns:meta/">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

      <!-- Description principale PDF/A-3 -->
      <rdf:Description rdf:about=""
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:xmp="http://ns.adobe.com/xap/1.0/"
          xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
          xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"
          pdfaid:part="3"
          pdfaid:conformance="B"
      >
        <!-- Dublin Core -->
        <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
        <dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>

        <!-- XMP Basic -->
        <xmp:CreateDate>${nowIso}</xmp:CreateDate>
        <xmp:ModifyDate>${nowIso}</xmp:ModifyDate>
        <xmp:CreatorTool>eInvoicing App</xmp:CreatorTool>

        <!-- Factur-X -->
        <fx:DocumentType>INVOICE</fx:DocumentType>
        <fx:DocumentFileName>${xmlFileName}</fx:DocumentFileName>
        <fx:Version>1.0</fx:Version>
        <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>
      </rdf:Description>

      <!-- Ajout de la description pour les fichiers attachés -->
      <rdf:Description rdf:about=""
          xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"
      >
        <fx:AttachedFiles>
          <rdf:Bag>
            <rdf:li rdf:parseType="Resource">
              <fx:DocumentFileName>${xmlFileName}</fx:DocumentFileName>
              <fx:MimeType>application/xml</fx:MimeType>
              <fx:Description>Factur-X invoice</fx:Description>
              <fx:AFRelationship>Source</fx:AFRelationship>
            </rdf:li>
          </rdf:Bag>
        </fx:AttachedFiles>
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
  const iccProfilePath = path.join(ASSETS_PATH, "icc/sRGB.icc");
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
    logger.warn("Profil ICC manquant pour la conformité PDF/A. Le PDF généré ne sera pas conforme.");
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
  const fontPath = path.join(ASSETS_PATH, "fonts/DejaVuSans.ttf");
  const fontBoldPath = path.join(ASSETS_PATH, "fonts/DejaVuSans-Bold.ttf");

  if (!fs.existsSync(fontPath) || !fs.existsSync(fontBoldPath)) {
    logger.error("Fichiers de police manquants ! Assurez-vous que DejaVuSans.ttf et DejaVuSans-Bold.ttf existent dans le dossier 'src/utils/invoice-pdf/fonts/'.");
    throw new Error("Fichiers de police requis pour la génération de PDF non trouvés.");
  }

  const fontBytes = fs.readFileSync(fontPath);
  const fontBoldBytes = fs.readFileSync(fontBoldPath);
  const fontRegular = await pdfDoc.embedFont(fontBytes, { subset: true });
  const fontBold = await pdfDoc.embedFont(fontBoldBytes, { subset: true });

  // --- Fin des modifications pour conformité PDF/A ---

  const margin = 50;

  // ---------------- Logo ----------------
  const logoPath = path.join(ASSETS_PATH, "logo.png");
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
  const seller = quote.seller || {};
  let sellerText = "";
  if (seller.legal_name) {
    sellerText += seller.company_type === 'AUTO'
      ? `${seller.legal_name} - Auto-entrepreneur\n`
      : `${seller.legal_name}\n`;
  }
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
  const client = quote.client || {};
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
  if (quote.invoice_number) {
    page.drawText(`Référence devis : ${quote.invoice_number}`, {
      x: margin,
      y,
      size: 10,
      font: fontBold,
    });
  }
  y -= 20;

  if (quote.issue_date)
    page.drawText(`Date d'émission : ${formatDateFr(quote.issue_date)}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });

  if (quote.supply_date)
    page.drawText(`Date de livraison : ${formatDateFr(quote.supply_date)}`, {
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
  const headers = ["Description", "Qté", "PU", "Taux", "HT", "TVA", "TTC"];
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
  quote.lines?.forEach((line) => {
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
    quote.subtotal ? `${quote.subtotal} €` : "",
    quote.total_taxes ? `${quote.total_taxes} €` : "",
    quote.total ? `${quote.total} €` : "",
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

  // ---------------- Mentions pour devis ----------------
  const mentionDevis = "Les conditions de paiement et mentions légales seront précisées sur la facture.";
  const maxWidth = 595 - 2 * margin;
  const wrappedLines = wrapText(mentionDevis, fontRegular, 9, maxWidth);

  wrappedLines.forEach(line => {
    if (y < 50) {
      page.addPage([595, 842]); // nouvelle page
      y = 842 - margin;
    }
    page.drawText(line, { x: margin, y, size: 9, font: fontRegular });
    y -= 12;
  });
  y -= 10;
    
  // ---------------- Save ----------------
  const uploadDir = path.join(__dirname, "../../uploads/pdf");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function generateInvoicePdfBuffer(invoice) {
  try {
    logger.info('➡️ Début generateInvoicePdfBuffer');
    logger.info('Invoice header:', invoice.header);
    logger.info('Seller object:', invoice.seller);
    logger.info('Client object:', invoice.client);

    const pdfDoc = await PDFDocument.create();
    const ASSETS_PATH = path.join(process.cwd(), "public/pdf-assets");

    // 1. Enregistrer fontkit pour la gestion des polices .ttf
    pdfDoc.registerFontkit(fontkit);
    logger.info('📄 Fontkit enregistré');

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

        <!-- Description principale PDF/A-3 -->
        <rdf:Description rdf:about=""
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:xmp="http://ns.adobe.com/xap/1.0/"
            xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
            xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"
            pdfaid:part="3"
            pdfaid:conformance="B"
        >
          <!-- Dublin Core -->
          <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
          <dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>

          <!-- XMP Basic -->
          <xmp:CreateDate>${nowIso}</xmp:CreateDate>
          <xmp:ModifyDate>${nowIso}</xmp:ModifyDate>
          <xmp:CreatorTool>eInvoicing App</xmp:CreatorTool>

          <!-- Factur-X -->
          <fx:DocumentType>INVOICE</fx:DocumentType>
          <fx:DocumentFileName>${xmlFileName}</fx:DocumentFileName>
          <fx:Version>1.0</fx:Version>
          <fx:ConformanceLevel>BASIC</fx:ConformanceLevel>
        </rdf:Description>

        <!-- Ajout de la description pour les fichiers attachés -->
        <rdf:Description rdf:about=""
            xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"
        >
          <fx:AttachedFiles>
            <rdf:Bag>
              <rdf:li rdf:parseType="Resource">
                <fx:DocumentFileName>${xmlFileName}</fx:DocumentFileName>
                <fx:MimeType>application/xml</fx:MimeType>
                <fx:Description>Factur-X invoice</fx:Description>
                <fx:AFRelationship>Source</fx:AFRelationship>
              </rdf:li>
            </rdf:Bag>
          </fx:AttachedFiles>
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
    logger.info('📑 Métadonnées XMP enregistrées');

    // 3. Ajouter un "OutputIntent" pour la gestion des couleurs
    const iccProfilePath = path.join(ASSETS_PATH, "icc/sRGB.icc");
    logger.info('ICC profile path:', iccProfilePath);

    if (fs.existsSync(iccProfilePath)) {
      const iccProfileBytes = fs.readFileSync(iccProfilePath);
      const outputIntent = pdfDoc.context.stream(iccProfileBytes);
      pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([{ Type: 'OutputIntent', S: 'GTS_PDFA1', OutputConditionIdentifier: 'sRGB IEC61966-2.1', DestOutputProfile: outputIntent }]));
      logger.info('🎨 OutputIntent ICC ajouté');
    } else {
      logger.info('⚠️ ICC profile manquant, pas d’OutputIntent');
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
    const fontPath = path.join(ASSETS_PATH, "fonts/DejaVuSans.ttf");
    const fontBoldPath = path.join(ASSETS_PATH, "fonts/DejaVuSans-Bold.ttf");

    logger.info('Vérification fichiers critiques...');
    logger.info('Font regular exists:', fs.existsSync(fontPath));
    logger.info('Font bold exists:', fs.existsSync(fontBoldPath));

    if (!fs.existsSync(fontPath) || !fs.existsSync(fontBoldPath)) {
      logger.error("Fichiers de police manquants ! Assurez-vous que DejaVuSans.ttf et DejaVuSans-Bold.ttf existent dans le dossier 'src/utils/invoice-pdf/fonts/'.");
      throw new Error("Fichiers de police requis pour la génération de PDF non trouvés.");
    }

    const fontBytes = fs.readFileSync(fontPath);
    const fontBoldBytes = fs.readFileSync(fontBoldPath);
    const fontRegular = await pdfDoc.embedFont(fontBytes, { subset: true });
    const fontBold = await pdfDoc.embedFont(fontBoldBytes, { subset: true });
    logger.info('📄 Polices embeded avec succès');

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
    const logoPath = path.join(ASSETS_PATH, "logo.png");
    logger.info('Logo exists:', fs.existsSync(logoPath));
    let logoHeight = 0;
    
    if (fs.existsSync(logoPath)) {
      const logoBytes = await fs.promises.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(1);
      const logoWidthMax = 120 * 2.5;
      const logoHeightMax = 60 * 2.5;
      const ratio = Math.min(logoWidthMax / logoDims.width, logoHeightMax / logoDims.height);
      const logoWidth = logoDims.width * ratio;
      logoHeight = logoDims.height * ratio;
      logger.info('Logo path:', logoPath);
      logger.info('Logo embedé avec succès, hauteur calculée:', logoHeight);
      
      page.drawImage(logoImage, {
        x: margin,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      logger.info('Logo embedé avec succès, hauteur:', logoHeight);
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
      logger.info('⚠️ Logo manquant, bloc substitut affiché');
    }

    const yTop = y;
    y -= logoHeight + 10;

    // ---------------- Seller (haut droite) ----------------
    const blockWidth = 220;
    let sellerText = "";
    if (seller.legal_name) {
      sellerText += seller.company_type === 'AUTO'
        ? `${seller.legal_name} - Auto-entrepreneur\n`
        : `${seller.legal_name}\n`;
    }  
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

    const headers = ["Description", "Qté", "PU", "Taux", "HT", "TVA", "TTC"];
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
      logger.info("seller:", seller);

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
    logger.info('➡️ PDF généré, taille bytes:', pdfBytes.length);

    return pdfBytes; 
  } catch (err) {
    logger.error('❌ ERREUR génération PDF:', err);
    throw err;
  }  
}

module.exports = { generateQuotePdf, generateInvoicePdfBuffer };
