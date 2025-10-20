// backend/src/modules/invoices/invoiceMail.controller.js
const { sendInvoiceMail } = require('./invoiceMail.service');

async function sendInvoiceMailController(req, res) {
  const invoiceId = req.params.id;
  const { message } = req.body;

  try {
    await sendInvoiceMail(invoiceId, message);
    res.json({ success: true, message: 'Facture envoyée par mail' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { sendInvoiceMail: sendInvoiceMailController };
