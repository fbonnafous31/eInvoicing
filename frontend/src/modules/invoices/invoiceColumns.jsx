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
        <button
          className="btn btn-sm"
          onClick={() => {
            if (row?.id) navigate(`/invoices/${row.id}`);
          }}
        >
          ✏️
        </button>
      ),
      ignoreRowClick: true,
      width: '50px', // pour la librairie, pas le DOM
    },
    {
      name: 'Référence',
      selector: row => row.invoice_number || '',
      sortable: true,
      width: '150px', // géré par la lib
      cell: row => <EllipsisCell value={row.invoice_number || ''} maxWidth="150px" />
    },
    {
      name: 'Emise le',
      selector: row => row.issue_date ? formatDate(row.issue_date) : '',
      sortable: true,
      width: '100px',
    },
    {
      name: 'Marché',
      selector: row => row.contract_number || '',
      sortable: true,
      cell: row => <EllipsisCell value={row.contract_number || ''} style={{ minWidth: '120px' }} />
    },
    {
      name: 'Commande',
      selector: row => row.purchase_order_number || '',
      sortable: true,
      cell: row => <EllipsisCell value={row.purchase_order_number || ''} style={{ minWidth: '120px' }} />
    },
    {
      name: 'Vendeur',
      selector: row => row.seller_legal_name || '',
      sortable: true,
      cell: row => <EllipsisCell value={row.seller_legal_name || ''} style={{ minWidth: '150px' }} />
    },
    {
      name: 'Client',
      selector: row => row.client_legal_name || '',
      sortable: true,
      cell: row => <EllipsisCell value={row.client_legal_name || ''} style={{ minWidth: '150px' }} />
    },
    {
      name: 'HT',
      selector: row => row.subtotal != null ? formatCurrency(row.subtotal) : '',
      sortable: true,
      cell: row => <RightCell value={row.subtotal != null ? formatCurrency(row.subtotal) : ''} />
    },
    {
      name: 'TVA',
      selector: row => row.total_taxes != null ? formatCurrency(row.total_taxes) : '',
      sortable: true,
      cell: row => <RightCell value={row.total_taxes != null ? formatCurrency(row.total_taxes) : ''} />
    },
    {
      name: 'TTC',
      selector: row => row.total != null ? formatCurrency(row.total) : '',
      sortable: true,
      cell: row => <RightCell value={row.total != null ? formatCurrency(row.total) : ''} />
    },
    {
      name: 'Statut',
      selector: row => row.status || '',
      sortable: true,
    },
    {
      name: 'Créé le',
      selector: row => row.created_at ? formatDate(row.created_at) : '',
      sortable: true,
      width: '150px',
    },
    {
      name: 'Modifié le',
      selector: row => row.updated_at ? formatDate(row.updated_at) : '',
      sortable: true,
      width: '150px',
    },
  ];
}
