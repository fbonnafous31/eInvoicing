// backend/src/modules/invoices/invoiceMail.controller.js
const { sendInvoiceMail } = require('./invoiceMail.service');

async function sendInvoiceMailController(req, res) {
  const invoiceId = req.params.id;
  const { message, subject, to } = req.body; 

  try {
    const info = await sendInvoiceMail(invoiceId, message, subject, to);
    res.json({ success: true, message: 'Facture envoyée par mail', info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { sendInvoiceMail: sendInvoiceMailController };
