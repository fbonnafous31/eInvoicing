import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Breadcrumb from '../../components/Breadcrumb';
import * as invoiceService from '../../services/invoices';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    invoiceService.fetchInvoices()
      .then(data => setInvoices(data))
      .catch(console.error);
  }, []);

  const columns = [
    { name: 'Référence facture', selector: row => row.invoice_number, sortable: true },
    { name: 'Date émission', selector: row => formatDate(row.issue_date), sortable: true },
    { name: 'N° Contrat', selector: row => row.contract_number, sortable: true },
    { name: 'N° Commande', selector: row => row.purchase_order_number, sortable: true },
    { name: 'Vendeur', selector: row => row.seller_legal_name, sortable: true },
    { name: 'Client', selector: row => row.client_legal_name, sortable: true },
    { name: 'Montant HT', selector: row => formatCurrency(row.subtotal), sortable: true, style: { textAlign: 'right' } },
    { name: 'Montant TVA', selector: row => formatCurrency(row.total_taxes), sortable: true, style: { textAlign: 'right' } },
    { name: 'Montant TTC', selector: row => formatCurrency(row.total), sortable: true, style: { textAlign: 'right' } },
    {
      name: 'Conditions paiement',
      selector: row => row.payment_terms,
      sortable: true,
      cell: row => (
        <div
          title={row.payment_terms}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.payment_terms}
        </div>
      ),
    },
    { name: 'Statut', selector: row => row.status, sortable: true },
    { name: 'Créé le', selector: row => formatDate(row.created_at), sortable: true },
    { name: 'Modifié le', selector: row => formatDate(row.updated_at), sortable: true },
  ];

  const filteredItems = invoices.filter(item => {
    const search = filterText.toLowerCase();
    return Object.values(item).some(
      val => val && val.toString().toLowerCase().includes(search)
    );
  });

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Factures', path: '/invoices' },
  ];

  return (
    <div className="container-fluid mt-4">
      {/* H1 invisible pour SEO/accessibilité */}
      <h1 className="visually-hidden">Liste des factures</h1>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <input
        type="text"
        placeholder="Rechercher une facture"
        className="form-control mb-3"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        style={{ maxWidth: '300px' }}
      />

      <DataTable
        columns={columns}
        data={filteredItems}
        pagination
        paginationPerPage={20}
        highlightOnHover
        striped
        responsive
        dense
        noHeader
        customStyles={{
          table: { style: { border: '1px solid #ddd', borderRadius: '4px' } },
          headRow: { style: { borderBottom: '2px solid #ccc' } },
          rows: { style: { borderBottom: '1px solid #eee' } },
        }}
      />
    </div>
  );
}
