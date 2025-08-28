// frontend/src/pages/invoices/InvoicesList.jsx
import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/layout/Breadcrumb';
import AuditPanel from '../../components/common/AuditPanel';
import { datatableStyles } from '../../modules/common/datatableStyles';
import * as invoiceService from '../../services/invoices';
import useInvoiceColumns from '../../modules/invoices/invoiceColumns';
import { FR } from '../../constants/translations';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [filterText, setFilterText] = useState('');

  // Hook pour les colonnes
  const columns = useInvoiceColumns();

  // Récupération des factures
  useEffect(() => {
  invoiceService.fetchInvoices()
    .then(data => {
      setInvoices(data);
    })
  .catch(console.error);

  }, []);

  // Filtre texte identique aux autres listes
  const getStatusLabel = status => FR.status[status] || status;
  const filteredItems = invoices.filter(item =>
    Object.entries(item).some(([key, val]) => {
      if (key === 'status') val = getStatusLabel(val);  // traduit le status
      return val && val.toString().toLowerCase().includes(filterText.toLowerCase());
    })
  );
  

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

      {/* Filtre */}
      <input
        type="text"
        placeholder="Rechercher une facture"
        className="form-control mb-3"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        style={{ maxWidth: '300px' }}
      />

      {/* DataTable */}
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
        fixedHeader
        fixedHeaderScrollHeight="70vh"
        expandableRows
        expandableRowsComponent={({ data }) => (
          <AuditPanel createdAt={data.created_at} updatedAt={data.updated_at} />
        )}
        expandOnRowClicked
        progressPending={!invoices.length}
        customStyles={datatableStyles}
      />
    </div>
  );
}
