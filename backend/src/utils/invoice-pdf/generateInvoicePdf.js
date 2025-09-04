const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts } = require("pdf-lib");

async function generateInvoicePdf(invoice) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); 
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  page.drawText(`Facture #${invoice.invoice_number}`, { x: 50, y: height - 100, size: 20, font });
  page.drawText(`Client: ${invoice.client?.legal_name || "N/A"}`, { x: 50, y: height - 130, size: 12, font });

  // dossier correct
  const uploadDir = path.join(__dirname, "../../uploads/pdf");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const fileName = `${invoice.id}_invoice.pdf`;
  const filePath = path.join(uploadDir, fileName);
  const pdfBytes = await pdfDoc.save();
  
  console.log("Écriture du PDF :", filePath);
  await fs.promises.writeFile(filePath, pdfBytes);

  return `/uploads/pdf/${fileName}`;
}

module.exports = { generateInvoicePdf };
