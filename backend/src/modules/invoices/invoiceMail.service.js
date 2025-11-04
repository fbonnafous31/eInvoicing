// backend/src/modules/invoices/invoiceMail.service.js
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const { getInvoiceById } = require('./invoices.service');
const { getSellerById } = require('../sellers/sellers.model');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoi une facture par email en utilisant Resend et le PDF/A-3 en base64
 * @param {number} invoiceId - ID de la facture
 * @param {string} [message] - Message personnalisé
 * @param {string} [subject] - Sujet personnalisé
 * @param {string} [to] - Destinataire personnalisé
 */
async function sendInvoiceMail(invoiceId, message, subject, to) {
  console.log(`[sendInvoiceMail] Début pour invoiceId=${invoiceId}`);

  // Récupération de la facture
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error('Facture introuvable');
  const clientEmail = to || invoice.client?.email;
  if (!clientEmail) throw new Error("Client n'a pas d'email");

  // Récupération du vendeur
  const seller = await getSellerById(invoice.seller_id);
  if (!seller) throw new Error('Vendeur introuvable');

  // SMTP de l’expéditeur
  const fromAddress = seller.smtp_from || seller.smtp_user || 'no-reply@example.com';
  const sellerName = seller?.legal_name?.trim() || 'Votre société';
  const invoiceNumber = invoice.invoice_number?.trim() || invoice.id;

  // PDF/A-3
  const pdfPath = path.join(__dirname, '../../uploads/pdf-a3', `${invoice.id}_pdf-a3.pdf`);
  if (!fs.existsSync(pdfPath)) throw new Error('PDF/A-3 introuvable');
  const pdfBuffer = fs.readFileSync(pdfPath);

  // Contenu de l’email
  const finalText = message?.trim() || `Bonjour ${invoice.client?.legal_name || 'Client'},\n\nVeuillez trouver ci-joint votre facture n°${invoiceNumber}.\n\nCordialement,\n${sellerName}`;
  const finalHtml = message
    ? `<p>${message.replace(/\n/g, '<br>')}</p>`
    : `<p>Bonjour ${invoice.client?.legal_name || 'Client'},</p>
       <p>Veuillez trouver ci-joint votre facture <strong>n°${invoiceNumber}</strong>.</p>
       <p>Cordialement,<br/>${sellerName}</p>`;

  // Attachments en base64
  const attachments = [
    {
      filename: `${invoiceNumber}_PDF-A3.pdf`,
      content: pdfBuffer.toString('base64'),
      type: 'application/pdf',
      encoding: 'base64',
    },
  ];

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: clientEmail,
      subject: subject?.trim() || `Votre facture n°${invoiceNumber}`,
      text: finalText,
      html: finalHtml,
      attachments,
    });

    console.log(`[sendInvoiceMail] Email envoyé à ${clientEmail}`);
    console.log('[sendInvoiceMail] Réponse Resend :', response);
    return response;
  } catch (err) {
    console.error('[sendInvoiceMail] Erreur lors de l’envoi :', err);
    throw err;
  }
}

module.exports = { sendInvoiceMail };
