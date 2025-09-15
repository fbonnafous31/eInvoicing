// frontend/src/pages/invoices/InvoicesList.jsx
import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/layout/Breadcrumb';
import AuditPanel from '../../components/common/AuditPanel';
import { datatableStyles } from '../../modules/common/datatableStyles';
import useInvoiceColumns from '../../modules/invoices/invoiceColumns';
import { FR } from '../../constants/translations';
import { useInvoiceService } from '@/services/invoices';
import { BUSINESS_STATUSES } from '../../constants/businessStatuses';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [version, setVersion] = useState(0); // compteur pour forcer re-render

  const invoiceService = useInvoiceService();

  // -------------------------------
  // Callbacks pour mise à jour du tableau
  // -------------------------------
  const handleTechnicalStatusChange = (invoiceId, newStatus) => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === invoiceId ? { ...inv, technical_status: newStatus } : inv))
    );
    setVersion(v => v + 1); 
  };

  const handleBusinessStatusChange = (invoiceId, statusCode, statusLabel) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, business_status: statusCode, business_status_label: statusLabel }
          : inv
      )
    );
    setVersion(v => v + 1); 
  };

  // -------------------------------
  // Colonnes avec callbacks
  // -------------------------------
  const columns = useInvoiceColumns(
    invoiceService,
    handleTechnicalStatusChange,
    handleBusinessStatusChange
  );

  // -------------------------------
  // Chargement initial des factures
  // -------------------------------
  const { fetchInvoicesBySeller } = invoiceService;
  useEffect(() => {
    let isMounted = true;

    const loadInvoices = async () => {
      try {
        console.log('[InvoiceList] Chargement des factures...');
        const data = await fetchInvoicesBySeller();
        if (isMounted) {
          setInvoices(data);
          console.log('[InvoiceList] Factures chargées:', data.map(i => `${i.id}:${i.business_status}`));
        }
      } catch (err) {
        console.error("[InvoiceList] Erreur chargement factures :", err);
      }
    };

    loadInvoices();

    return () => {
      isMounted = false;
    };
  }, [fetchInvoicesBySeller]);

  const filteredItems = invoices.filter(item =>
    Object.entries(item).some(([key, val]) => {
      // Business status
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

      return val && val.toString().toLowerCase().includes(filterText.toLowerCase());
    })
  );

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
        key={version} // forcer re-render à chaque changement de statut
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
