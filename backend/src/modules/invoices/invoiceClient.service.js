// backend/src/modules/invoices/invoiceClient.service.js
const InvoiceClientModel = require("./invoiceClient.model.js");

const InvoiceClientService = {
  async create(invoiceId, clientData) {
    return await InvoiceClientModel.create(invoiceId, clientData);
  },

  async getByInvoiceId(invoiceId) {
    return await InvoiceClientModel.findByInvoiceId(invoiceId);
  },

  async update(invoiceId, clientData) {
    return await InvoiceClientModel.update(invoiceId, clientData);
  },

  async delete(invoiceId) {
    return await InvoiceClientModel.delete(invoiceId);
  },
};

// ✅ Ici on exporte avec CommonJS
module.exports = InvoiceClientService;
