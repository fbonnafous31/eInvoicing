const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { getInvoiceById } = require('./invoices.service');

async function sendInvoiceMail(invoiceId, message) {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Facture introuvable");
  if (!invoice.client?.email) throw new Error("Client n'a pas d'email");

  // Chercher le PDF/A-3
  const pdfAttachment = invoice.attachments.find(a => a.filename?.endsWith('_pdf-a3.pdf'));
  const pdfPath = pdfAttachment
    ? path.join(__dirname, '../../uploads/pdf-a3', pdfAttachment.filename)
    : path.join(__dirname, '../../uploads/pdf-a3', `${invoice.id}_pdf-a3.pdf`);

  if (!fs.existsSync(pdfPath)) throw new Error("PDF/A-3 introuvable");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,       // ✅ ton email vérifié Brevo
    to: invoice.client.email,
    subject: `Facture ${invoice.invoice_number} de ${invoice.seller.legal_name}`,
    text: message || `Bonjour ${invoice.client.legal_name},\n\nVeuillez trouver votre facture en pièce jointe.\n\nCordialement,\n${invoice.seller.legal_name}`,
    attachments: [
      { filename: `${invoice.invoice_number}_PDF-A3.pdf`, path: pdfPath }
    ]
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendInvoiceMail };
