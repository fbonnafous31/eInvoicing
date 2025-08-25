const InvoicesModel = require("./invoices.model");
const InvoiceClientModel = require("./invoiceClient.model");

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  const invoice = await InvoicesModel.getInvoiceById(id);
  if (!invoice) return null;

  const client = await InvoiceClientModel.findByInvoiceId(id);
  return { ...invoice, client };
}

/**
 * Crée une facture avec son bloc client, ses lignes, taxes et justificatifs
 * @param {Object} data - { invoice, client, lines, taxes, attachments }
 */
async function createInvoice(data) {
  const { invoice, client, lines, taxes, attachments } = data;

  if (client) {
    // Définit legal_name si absent
    client.legal_name = client.legal_name || client.client_legal_name || `${client.first_name || ''} ${client.last_name || ''}`.trim();

    // Définit legal_identifier_type selon type de client
    if (!client.legal_identifier_type) {
      if (client.client_type === 'company_fr') client.legal_identifier_type = 'SIRET';
      else if (client.client_type === 'company_eu') client.legal_identifier_type = 'VAT';
      else client.legal_identifier_type = 'NAME';
    }

    // Définit legal_identifier selon type de client
    if (!client.legal_identifier) {
      if (client.client_type === 'company_fr') client.legal_identifier = client.siret;
      else if (client.client_type === 'company_eu') client.legal_identifier = client.vat_number;
      else client.legal_identifier = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }

    // Pour l’invoice principal
    invoice.client_legal_name = client.legal_name;
  }

  // 1. Crée la facture
  const createdInvoice = await InvoicesModel.createInvoice({
    invoice,
    lines,
    taxes,
    attachments,
  });

  // 2. Crée le bloc client rattaché à la facture
  if (client) {
    await InvoiceClientModel.create(createdInvoice.id, client);
  }

  return {
    ...createdInvoice,
    client: client || null,
  };
}

async function deleteInvoice(id) {
  return await InvoicesModel.deleteInvoice(id);
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  deleteInvoice,
};
