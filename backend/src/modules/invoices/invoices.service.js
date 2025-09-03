// invoices.service.js
const InvoicesModel = require('./invoices.model');
const { generateFacturXXML } = require('../../utils/facturx-generator');
const { embedFacturXInPdf } = require('../../utils/pdf-generator');
const InvoicesAttachmentsModel = require('./invoiceAttachments.model');
const fs = require('fs');
const path = require('path');

const FACTURX_DIR = path.resolve('src/uploads/factur-x');

function prepareClientForXML(client) {
  if (!client) return {};
  return {
    legal_name: client.legal_name || `${client.client_legal_name || ''}`.trim(),
    address: client.address || client.client_address,
    city: client.city || client.client_city,
    postal_code: client.postal_code || client.client_postal_code,
    country_code: client.country_code || client.client_country_code,
    email: client.email || client.client_email,
    phone: client.phone || client.client_phone,
  };
}

function saveFacturXXML(id, invoiceData) {
  if (!fs.existsSync(FACTURX_DIR)) {
    fs.mkdirSync(FACTURX_DIR, { recursive: true });
  }
  const xml = generateFacturXXML(invoiceData);
  const xmlPath = path.join(FACTURX_DIR, `${id}-factur-x.xml`);
  fs.writeFileSync(xmlPath, xml, 'utf-8');
  return xmlPath;
}

async function getMainPdfPath(invoiceId) {
  const attachment = await InvoicesAttachmentsModel.getAttachment(invoiceId, 'main');
  if (!attachment) throw new Error(`PDF principal introuvable pour invoice ${invoiceId}`);
  return path.resolve(attachment.file_path); 
}

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  const invoice = await InvoicesModel.getInvoiceById(id);
  return invoice || null;
}

async function createInvoice(data) {
  const { invoice, client, lines, taxes, attachments } = data;

  console.log("=== createInvoice called ===");
  const createdInvoice = await InvoicesModel.createInvoice({ invoice, client, lines, taxes, attachments });
  console.log("✅ Invoice created, id:", createdInvoice.id);

  const clientForXML = prepareClientForXML(createdInvoice.client);

  const xmlPath = saveFacturXXML(createdInvoice.id, {
    header: invoice,
    seller: createdInvoice.seller,
    client: clientForXML,
    lines,
    taxes,
    attachments,
  });

  console.log("📄 Factur-X saved at:", xmlPath);

  const mainPdfPath = await InvoicesAttachmentsModel.getAttachment(createdInvoice.id, 'main');
  if (!mainPdfPath) throw new Error(`PDF principal introuvable pour invoice ${createdInvoice.id}`);
  
  const additionalAttachments = await InvoicesAttachmentsModel.getAdditionalAttachments(createdInvoice.id);
  const pdfA3Path = await embedFacturXInPdf(mainPdfPath.file_path, xmlPath, additionalAttachments, createdInvoice.id);

  console.log("📄 PDF/A-3 generated at:", pdfA3Path);

  return { ...createdInvoice, facturxPath: xmlPath, pdfPath: pdfA3Path };
}

async function updateInvoice(id, data) {
  const { invoice, client, lines, taxes, attachments } = data;

  console.log("=== updateInvoice called for id:", id, "===");
  const updatedInvoice = await InvoicesModel.updateInvoice(id, {
    invoice,
    client,
    lines,
    taxes,
    newAttachments: attachments,
    existingAttachments: []
  });
  console.log("✅ Invoice updated, updatedInvoice:", updatedInvoice);

  const clientForXML = prepareClientForXML(updatedInvoice.client);

  const xmlPath = saveFacturXXML(id, {
    header: invoice,
    seller: updatedInvoice.seller,
    client: clientForXML,
    lines,
    taxes,
    attachments,
  });

  const mainPdfPath = await getMainPdfPath(updatedInvoice.id);
  const additionalAttachments = await InvoicesAttachmentsModel.getAdditionalAttachments(updatedInvoice.id);
  const pdfA3Path = await embedFacturXInPdf(mainPdfPath, xmlPath, additionalAttachments, updatedInvoice.id);
  console.log("📄 PDF/A-3 generated at:", pdfA3Path);

  return { ...updatedInvoice, facturxPath: xmlPath, pdfPath: pdfA3Path };
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