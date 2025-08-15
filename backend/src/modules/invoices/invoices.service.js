const InvoicesModel = require('./invoices.model');
console.log(InvoicesModel);

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

module.exports = {
  listInvoices
};