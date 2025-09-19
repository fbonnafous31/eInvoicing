// frontend/src/pages/invoices/InvoicesList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/layout/Breadcrumb';
import AuditPanel from '../../components/common/AuditPanel';
import { datatableStyles } from '../../modules/common/datatableStyles';
import useInvoiceColumns from '../../modules/invoices/invoiceColumns';
import { FR } from '../../constants/translations';
import { useInvoiceService } from '@/services/invoices';
import { BUSINESS_STATUSES } from '../../constants/businessStatuses';

export default function InvoicesList() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialFilter = params.get('filter') || '';

  const [invoices, setInvoices] = useState([]);
  const [filterText, setFilterText] = useState(initialFilter);

  const invoiceService = useInvoiceService();
  const { fetchInvoicesBySeller } = invoiceService;

  // -------------------------------
  // Callbacks pour mise à jour du tableau
  // -------------------------------
  const handleTechnicalStatusChange = (invoiceId, newStatus) => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === invoiceId ? { ...inv, technical_status: newStatus } : inv))
    );
  };

  const handleBusinessStatusChange = (invoiceId, statusCode, statusLabel) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, business_status: statusCode, business_status_label: statusLabel }
          : inv
      )
    );
  };

  const onInvoiceUpdate = updatedInvoice => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
  };

  // -------------------------------
  // Colonnes avec callbacks
  // -------------------------------
  const columns = useInvoiceColumns(
    invoiceService,
    handleTechnicalStatusChange,
    handleBusinessStatusChange,
    onInvoiceUpdate
  );

  // -------------------------------
  // Chargement initial des factures
  // -------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadInvoices = async () => {
      try {
        const data = await fetchInvoicesBySeller();
        if (isMounted) setInvoices(data);
      } catch (err) {
        console.error('Erreur chargement factures :', err);
      }
    };

    loadInvoices();

    return () => {
      isMounted = false;
    };
  }, [fetchInvoicesBySeller]);

  // -------------------------------
  // Filtrage
  // -------------------------------
  const filteredItems = useMemo(() => {
    if (!filterText) return invoices;

    return invoices.filter(item =>
      Object.entries(item).some(([key, val]) => {
        // Convertir le code business_status en label
        if (key === 'business_status' || key === 'status') {
          const code = parseInt(val, 10);
          if (!isNaN(code) && BUSINESS_STATUSES[code]) {
            val = BUSINESS_STATUSES[code].label;
          }
        }

        // Technical status
        if (key === 'technical_status') {
          val = FR.technicalStatus[val?.toLowerCase()] || val;
        }

        return val?.toString().toLowerCase().includes(filterText.toLowerCase());
      })
    );
  }, [invoices, filterText]);

  // -------------------------------
  // Breadcrumb
  // -------------------------------
  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Factures', path: '/invoices' },
  ];

  // -------------------------------
  // Rendu
  // -------------------------------
  return (
    <div className="container-fluid p-5 mt-4">
      <h1 className="visually-hidden">Liste des factures</h1>
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
