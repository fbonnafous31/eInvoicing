const InvoicesModel = require("./invoices.model");

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  const invoice = await InvoicesModel.getInvoiceById(id);
  return invoice || null;
}

/**
 * Crée une facture avec ses lignes, taxes et justificatifs
 */
async function createInvoice(data) {
  const { invoice, client, lines, taxes, attachments } = data;

  const createdInvoice = await InvoicesModel.createInvoice({
    invoice,
    client,
    lines,
    taxes,
    attachments,
  });

  return createdInvoice;
}

/**
 * Met à jour une facture complète
 */
async function updateInvoice(id, data) {
  const { invoice, client, lines, taxes, attachments } = data;

  return await InvoicesModel.updateInvoice(id, {
    invoice,
    client,
    lines,
    taxes,
    newAttachments: attachments,
    existingAttachments: [] 
  });
}


async function deleteInvoice(id) {
  return await InvoicesModel.deleteInvoice(id);
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
