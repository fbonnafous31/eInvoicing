const InvoicesModel = require('./invoices.model'); // le modèle avec pg pool et toutes les requêtes CRUD

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  return await InvoicesModel.getInvoiceById(id);
}

/**
 * Crée une facture avec ses lignes, taxes et justificatifs
 * @param {Object} data - { invoice, lines, taxes, attachments }
 */
async function createInvoice(data) {
  return await InvoicesModel.createInvoice(data);
}

async function deleteInvoice(id) {
  return await InvoicesModel.deleteInvoice(id);
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  deleteInvoice
};
