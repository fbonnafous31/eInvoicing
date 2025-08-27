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
  const { invoice, lines, taxes, attachments } = data;

  // 1. Met à jour la facture principale
  const updatedInvoice = await InvoicesModel.updateInvoice(id, invoice);

  // 2. Met à jour les lignes, taxes et attachments si nécessaire
  if (lines) await InvoicesModel.updateLines(id, lines);
  if (taxes) await InvoicesModel.updateTaxes(id, taxes);
  if (attachments) await InvoicesModel.updateAttachments(id, attachments);

  // 3. Retourne l’état complet
  return await getInvoice(id);
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
