// utils/invoiceStatus.js
export function canSendInvoice(row) {
  if (!row) return false;
  return (
    row.business_status === "pending" ||
    row.technical_status === "rejected" ||
    row.business_status === "208"
  );
}
