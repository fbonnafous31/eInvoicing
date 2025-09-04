const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function generateInvoicePdf(invoice) {
  console.log("invoice:", invoice);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  // Polices
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;

  // ---------------- Logo ----------------
  const logoPath = path.join(__dirname, "logo.png");
  const logoWidthMax = 120 * 2.5; // largeur max multipliée par 2.5
  const logoHeightMax = 60 * 2.5; // hauteur max multipliée par 2.5

  let logoHeight = 0;
  let yLogoTop = height - margin;

  if (fs.existsSync(logoPath)) {
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
    page.drawText(`Date d'émission : ${invoice.issue_date}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
    });
  if (invoice.supply_date)
    page.drawText(`Date de livraison : ${invoice.supply_date}`, {
      x: margin + 200,
      y,
      size: 10,
      font: fontRegular,
    });
  if (invoice.payment_terms)
    page.drawText(`Conditions de paiement : ${invoice.payment_terms}`, {
      x: margin,
      y: y - 15,
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

  y = tableY - 40;

  // ---------------- Totaux ----------------
  const totalLabels = ["Sous-total", "Total TVA", "Total TTC"];
  const totalValues = [
    invoice.subtotal ? `${invoice.subtotal} €` : "",
    invoice.total_taxes ? `${invoice.total_taxes} €` : "",
    invoice.total ? `${invoice.total} €` : "",
  ];

  const boxWidth = 180;
  const boxHeight = totalLabels.length * 20 + 20;
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

  // ---------------- Save ----------------
  const uploadDir = path.join(__dirname, "../../uploads/pdf");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const fileName = `${invoice.id}_invoice.pdf`;
  const filePath = path.join(uploadDir, fileName);
  const pdfBytes = await pdfDoc.save();
  await fs.promises.writeFile(filePath, pdfBytes);

  console.log("Écriture du PDF :", filePath);
  return filePath;
}

module.exports = { generateInvoicePdf };
