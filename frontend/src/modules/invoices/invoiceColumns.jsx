// frontend/src/modules/invoices/invoiceColumns.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';
import { formatCurrency, formatDate } from '../../utils/formatters/formatters';

export default function useInvoiceColumns() {
  const navigate = useNavigate();

  const RightCell = ({ value }) => <div style={{ textAlign: 'right' }}>{value}</div>;

  return [
    {   
      cell: row => (
        <button className="btn btn-sm" onClick={() => navigate(`/invoices/${row.id}`)}>
          ✏️
        </button>
      ),
      ignoreRowClick: true,
      width: '50px',
    },
    {
      name: 'Référence',
      selector: row => row.invoice_number,
      sortable: true,
      width: '150px',
      cell: row => <EllipsisCell value={row.invoice_number} maxWidth="150px" />
    },
    {
      name: 'Emise le',
      selector: row => formatDate(row.issue_date),
      sortable: true,
      width: '100px',
    },
    {
      name: 'Marché',
      selector: row => row.contract_number,
      sortable: true,
      minWidth: '120px', 
      cell: row => <EllipsisCell value={row.contract_number} />
    },
    {
      name: 'Commande',
      selector: row => row.purchase_order_number,
      sortable: true,
      minWidth: '120px', 
      cell: row => <EllipsisCell value={row.purchase_order_number} />
    },
    {
      name: 'Vendeur',
      selector: row => row.seller_legal_name,
      sortable: true,
      minWidth: '150px', 
      cell: row => <EllipsisCell value={row.seller_legal_name} />
    },
    {
      name: 'Client',
      selector: row => row.client_legal_name,
      sortable: true,
      minWidth: '150px', 
      cell: row => <EllipsisCell value={row.client_legal_name} />
    },
    {
      name: 'HT',
      selector: row => formatCurrency(row.subtotal),
      sortable: true,
      cell: row => <RightCell value={formatCurrency(row.subtotal)} />
    },
    {
      name: 'TVA',
      selector: row => formatCurrency(row.total_taxes),
      sortable: true,
      cell: row => <RightCell value={formatCurrency(row.total_taxes)} />
    },
    {
      name: 'TTC',
      selector: row => formatCurrency(row.total),
      sortable: true,
      cell: row => <RightCell value={formatCurrency(row.total)} />
    },
    {
      name: 'Statut',
      selector: row => row.status,
      sortable: true,
    },
    {
      name: 'Créé le',
      selector: row => formatDate(row.created_at),
      sortable: true,
      width: '150px',
    },
    {
      name: 'Modifié le',
      selector: row => formatDate(row.updated_at),
      sortable: true,
      width: '150px',
    },
  ];
}
