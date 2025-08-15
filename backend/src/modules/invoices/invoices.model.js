const pool = require('../../config/db');

async function getAllInvoices() {
  const result = await pool.query(
    `SELECT invoice_number, issue_date, contract_number, purchase_order_number, seller_legal_name, client_legal_name, 
            subtotal, total_taxes, total, payment_terms, status, created_at, updated_at
     FROM invoicing.invoices;`
  );
  return result.rows;
}

module.exports = {
  getAllInvoices
};
