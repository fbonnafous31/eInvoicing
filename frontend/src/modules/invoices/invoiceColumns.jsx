import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';
import { formatCurrency, formatDate } from '../../utils/formatters/formatters';
import { FR } from '../../constants/translations';

export default function useInvoiceColumns() {
  const navigate = useNavigate();

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
      width: '150px', 
      cell: row => <EllipsisCell value={row.invoice_number || ''} maxWidth="150px" />
    },
    {
      name: 'Emise le',
      selector: row => row.issue_date ? formatDate(row.issue_date) : '',
      sortable: true,
      width: '100px',
    },
    {
      name: 'Contrat',
      selector: row => row.contract_number || '',
      sortable: true,
      width: '120px',
      cell: row => <EllipsisCell value={row.contract_number || ''} style={{ minWidth: '120px' }} />
    },
    {
      name: 'Commande',
      selector: row => row.purchase_order_number || '',
      sortable: true,
      width: '120px',
      cell: row => <EllipsisCell value={row.purchase_order_number || ''} style={{ minWidth: '120px' }} />
    },
    {
      name: 'Vendeur',
      selector: row => row.seller_legal_name || '',
      sortable: true,
      width: '140px',
      cell: row => <EllipsisCell value={row.seller_legal_name || ''} style={{ minWidth: '150px' }} />
    },
    {
      name: 'Client',
      selector: row => row.client_legal_name || '',
      sortable: true,
      width: '140px',
      cell: row => <EllipsisCell value={row.client_legal_name || ''} style={{ minWidth: '150px' }} />
    },
    {
      name: 'HT',
      selector: row => row.subtotal,
      sortable: true,
      style: { justifyContent: 'flex-end', textAlign: 'right' },
      format: row => formatCurrency(row.subtotal)
    },    
    {
      name: 'TVA',
      selector: row => row.total_taxes,
      sortable: true,
      style: { justifyContent: 'flex-end', textAlign: 'right' },
      format: row => formatCurrency(row.total_taxes)
    },
    {
      name: 'TTC',
      selector: row => row.total,
      sortable: true,
      style: { justifyContent: 'flex-end', textAlign: 'right' },
      format: row => formatCurrency(row.total)
    },    
    {
      name: 'Statut',
      selector: row => row.status || '',
      sortable: true,
      cell: row => (
        <div style={{ textAlign: 'center' }}>
          {FR.status[row.status] || row.status}
        </div>
      )
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
