const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { getInvoiceById } = require('./invoices.service');
const { getSellerById } = require('../sellers/sellers.model');

/**
 * Envoi une facture par email en utilisant la configuration SMTP du vendeur
 * @param {number} invoiceId - L'identifiant de la facture
 * @param {string} [message] - Message personnalisé
 * @returns {Promise<object>} - Résultat Nodemailer
 */
async function sendInvoiceMail(invoiceId, message) {
  console.log(`[sendInvoiceMail] Début de l’envoi pour invoiceId=${invoiceId}`);

  // --- Récupération de la facture
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Facture introuvable");
  if (!invoice.client?.email) throw new Error("Client n'a pas d'email");

  // --- Récupération du vendeur et sa config SMTP
  const seller = await getSellerById(invoice.seller_id);
  console.log('[sendInvoiceMail] SMTP settings received:', seller.smtp_settings || {
    smtp_host: seller.smtp_host,
    smtp_port: seller.smtp_port,
    smtp_user: seller.smtp_user,
    smtp_pass: seller.smtp_pass,
    smtp_from: seller.smtp_from,
    smtp_secure: seller.smtp_secure,
    active: seller.active
  });

  if (!seller) throw new Error("Vendeur introuvable");
  if (!seller.smtp_host || !seller.smtp_user || !seller.smtp_pass) {
    throw new Error("Le vendeur n'a pas configuré de paramètres SMTP valides");
  }

  console.log(`[sendInvoiceMail] SMTP du vendeur : host=${seller.smtp_host} user=${seller.smtp_user}`);

  // --- Chercher le PDF/A-3
  const pdfAttachment = invoice.attachments?.find(a => a.filename?.endsWith('_pdf-a3.pdf'));
  const pdfPath = pdfAttachment
    ? path.join(__dirname, '../../uploads/pdf-a3', pdfAttachment.filename)
    : path.join(__dirname, '../../uploads/pdf-a3', `${invoice.id}_pdf-a3.pdf`);

  if (!fs.existsSync(pdfPath)) throw new Error("PDF/A-3 introuvable");
  console.log(`[sendInvoiceMail] PDF trouvé : ${pdfPath}`);

  // --- Création du transporteur Nodemailer
  const transporter = nodemailer.createTransport({
    host: seller.smtp_host,
    port: Number(seller.smtp_port) || 587,
    secure: seller.smtp_secure || false,
    auth: {
      user: seller.smtp_user,
      pass: seller.smtp_pass
    }
  });

  // --- Test de connexion
  try {
    console.log('[sendInvoiceMail] Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('[sendInvoiceMail] Connexion SMTP réussie.');
  } catch (err) {
    console.error('[sendInvoiceMail] Erreur connexion SMTP :', err.message);
    throw err;
  }

  // --- Construction du mail
  const mailOptions = {
    from: seller.smtp_from || seller.smtp_user,
    to: invoice.client.email,
    subject: `Facture ${invoice.invoice_number} de ${seller.legal_name}`,
    text: message || `Bonjour ${invoice.client.legal_name},\n\nVeuillez trouver votre facture en pièce jointe.\n\nCordialement,\n${seller.legal_name}`,
    html: message ? `<p>${message.replace(/\n/g, '<br>')}</p>` : `<p>Bonjour ${invoice.client.legal_name},</p><p>Veuillez trouver votre facture en pièce jointe.</p><p>Cordialement,<br/>${seller.legal_name}</p>`,
    attachments: [
      { filename: `${invoice.invoice_number}_PDF-A3.pdf`, path: pdfPath }
    ]
  };

  // --- Envoi du mail
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendInvoiceMail] Email envoyé avec succès à ${invoice.client.email}`);
    console.log('[sendInvoiceMail] Réponse du serveur :', info.response);
    return info;
  } catch (err) {
    console.error('[sendInvoiceMail] Erreur lors de l’envoi du mail :', err.message);
    throw err;
  }
}

module.exports = { sendInvoiceMail };
