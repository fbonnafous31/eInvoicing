const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { getInvoiceById } = require('./invoices.service');
const { getSellerById } = require('../sellers/sellers.model');

/**
 * Envoi une facture par email en utilisant la configuration SMTP du vendeur
 * @param {number} invoiceId - L'identifiant de la facture
 * @param {string} [message] - Message personnalisé
 * @param {string} [subject] - Sujet personnalisé
 * @param {string} [to] - Destinataire personnalisé
 * @returns {Promise<object>} - Résultat Nodemailer
 */
async function sendInvoiceMail(invoiceId, message, subject, to) {
  console.log(`[sendInvoiceMail] Début de l’envoi pour invoiceId=${invoiceId}`);

  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Facture introuvable");
  if (!invoice.client?.email && !to) throw new Error("Client n'a pas d'email");

  const seller = await getSellerById(invoice.seller_id);
  if (!seller) throw new Error("Vendeur introuvable");

  const smtp = seller.smtp_settings || {
    smtp_host: seller.smtp_host,
    smtp_port: seller.smtp_port,
    smtp_user: seller.smtp_user,
    smtp_pass: seller.smtp_pass,
    smtp_from: seller.smtp_from,
    smtp_secure: seller.smtp_secure,
    active: seller.active
  };

  if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
    throw new Error("Le vendeur n'a pas configuré de paramètres SMTP valides");
  }

  console.log(`[sendInvoiceMail] SMTP du vendeur : host=${smtp.smtp_host} user=${smtp.smtp_user}`);

  // PDF/A-3
  const pdfAttachment = invoice.attachments?.find(a => a.filename?.toLowerCase().endsWith('_pdf-a3.pdf'));
  const pdfPath = pdfAttachment
    ? path.join(__dirname, '../../uploads/pdf-a3', pdfAttachment.filename)
    : path.join(__dirname, '../../uploads/pdf-a3', `${invoice.id}_pdf-a3.pdf`);
  if (!fs.existsSync(pdfPath)) throw new Error("PDF/A-3 introuvable");
  console.log(`[sendInvoiceMail] PDF trouvé : ${pdfPath}`);

  // Transporteur Nodemailer
  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: Number(smtp.smtp_port) || 587,
    secure: smtp.smtp_secure || false,
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass
    }
  });

  try {
    console.log('[sendInvoiceMail] Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('[sendInvoiceMail] Connexion SMTP réussie.');
  } catch (err) {
    console.error('[sendInvoiceMail] Erreur connexion SMTP :', err.message);
    throw err;
  }

  const sellerName = seller?.legal_name?.trim() || 'Votre société';
  const invoiceNumber = invoice.invoice_number?.trim() || '';
  const fromAddress = smtp.smtp_from || smtp.smtp_user || 'no-reply@example.com';
  const clientName = invoice.client?.legal_name || 'Client';
  const clientEmail = to || invoice.client?.email;

  const useMessage = message?.trim() ? message : null;
  const finalSubject = subject?.trim() || `Votre facture ${invoiceNumber} de ${sellerName}`;

  const defaultText = `Bonjour ${clientName},

Nous espérons que vous allez bien.
Veuillez trouver ci-joint votre facture n°${invoiceNumber}.

Si vous avez la moindre question, n'hésitez pas à nous contacter.

Cordialement,
${sellerName}`;

  const defaultHtml = `<p>Bonjour ${clientName},</p>
<p>Nous espérons que vous allez bien.</p>
<p>Veuillez trouver ci-joint votre facture <strong>n°${invoiceNumber}</strong>.</p>
<p>Si vous avez la moindre question, n'hésitez pas à nous contacter.</p>
<p>Cordialement,<br/>${sellerName}</p>`;

  const mailOptions = {
    from: fromAddress,
    to: clientEmail,
    subject: finalSubject,
    text: useMessage || defaultText,
    html: useMessage ? `<p>${useMessage.replace(/\n/g, '<br>')}</p>` : defaultHtml,
    attachments: [
      { filename: `${invoiceNumber}_PDF-A3.pdf`, path: pdfPath }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendInvoiceMail] Email envoyé avec succès à ${clientEmail}`);
    console.log('[sendInvoiceMail] Réponse du serveur :', info.response);
    return info;
  } catch (err) {
    console.error('[sendInvoiceMail] Erreur lors de l’envoi du mail :', err.message);
    throw err;
  }
}

module.exports = { sendInvoiceMail };
