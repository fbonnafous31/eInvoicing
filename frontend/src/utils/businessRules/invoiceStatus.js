// utils/invoiceStatus.js
const statusMapping = {
  mock: {
    pending: 'pending',
    rejected: 'rejected',
    completed: '208',
  },
  iopole: {
    pending: 'pending',
    rejected: 'rejected',
    completed: 'COMPLETED',
  },
};

export function canSendInvoice(row) {
  if (!row) return false;

  const provider = import.meta.env.VITE_PDP_PROVIDER || 'mock';
  const status = statusMapping[provider];

  return (
    row.technical_status === status.pending ||   
    row.technical_status === status.rejected ||
    row.business_status === status.completed
  );
}

