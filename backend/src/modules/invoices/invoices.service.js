// invoices.service.js
const InvoicesModel = require('./invoices.model');
const InvoiceArtifactService = require('./invoiceArtifact.service');

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  const invoice = await InvoicesModel.getInvoiceById(id);
  return invoice || null;
}

async function createInvoice(data) {
  const { invoice, client, lines, taxes, attachments } = data;
  const createdInvoice = await InvoicesModel.createInvoice({ invoice, client, lines, taxes, attachments });
  console.log("✅ Invoice created, id:", createdInvoice.id);
  
  // Délégation de la génération des artefacts
  const { xmlPath, pdfA3Path } = await InvoiceArtifactService.generateInvoiceArtifacts(createdInvoice);

  return { ...createdInvoice, facturxPath: xmlPath, pdfPath: pdfA3Path };
}

async function updateInvoice(id, data) {
  const { invoice, client, lines, taxes, newAttachments, existingAttachments } = data;

  console.log("=== updateInvoice called for id:", id, "===");

  const updatedInvoice = await InvoicesModel.updateInvoice(id, {
    invoice,
    client,
    lines,
    taxes,
    newAttachments,
    existingAttachments
  });
  console.log("✅ Invoice updated, updatedInvoice:", updatedInvoice);

  // Délégation de la génération des artefacts
  const { xmlPath, pdfA3Path } = await InvoiceArtifactService.generateInvoiceArtifacts(updatedInvoice);

  return { ...updatedInvoice, facturxPath: xmlPath, pdfPath: pdfA3Path };
}

async function deleteInvoice(id) {
  return await InvoicesModel.deleteInvoice(id);
}

async function getInvoicesBySeller(sellerId) {
  return await InvoicesModel.getInvoicesBySeller(sellerId);
}

async function getInvoiceById(id) {
  return await InvoicesModel.getInvoiceById(id);
}

async function getInvoiceStatusComment(invoiceId, statusCode) {
  return await InvoicesModel.getInvoiceStatusComment(invoiceId, statusCode);
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesBySeller,
  getInvoiceById,
  getInvoiceStatusComment,
};