// frontend/src/pages/invoices/InvoicesList.jsx
import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/layout/Breadcrumb';
import AuditPanel from '../../components/common/AuditPanel';
import { datatableStyles } from '../../modules/common/datatableStyles';
import useInvoiceColumns from '../../modules/invoices/invoiceColumns';
import { FR } from '../../constants/translations';
import { useInvoiceService } from '@/services/invoices';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [filterText, setFilterText] = useState('');

  const invoiceService = useInvoiceService();

  // Callback pour mettre à jour le statut technique dans le tableau
  const handleTechnicalStatusChange = (invoiceId, newStatus) => {
    setInvoices(prev =>
      prev.map(inv => inv.id === invoiceId ? { ...inv, technical_status: newStatus } : inv)
    );
  };

  // Hook pour les colonnes, on passe le callback
  const columns = useInvoiceColumns(invoiceService, handleTechnicalStatusChange);

  // Récupération des factures
  const { fetchInvoicesBySeller } = invoiceService;
  useEffect(() => {
    let isMounted = true; // pour éviter les updates après un unmount

    const loadInvoices = async () => {
      try {
        const data = await fetchInvoicesBySeller(); // token géré automatiquement par le service
        if (isMounted) setInvoices(data);
      } catch (err) {
        console.error("Erreur chargement factures :", err);
      }
    };

    loadInvoices();

    return () => { isMounted = false; };
  }, [fetchInvoicesBySeller]);

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
    <div className="container-fluid p-5 mt-4">
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
        style={{ width: '100vw' }}
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
