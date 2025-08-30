// frontend/src/pages/clients/ClientsList.jsx
import React, { useState } from 'react';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/layout/Breadcrumb';
import useClients from '../../modules/clients/useClients';
import useClientColumns from '../../modules/clients/clientColumns';
import { datatableStyles } from '../../modules/common/datatableStyles';
import AuditPanel from '../../components/common/AuditPanel';

export default function ClientsList() {
  const { clients, loading, error } = useClients();
  const columns = useClientColumns();
  const [filterText, setFilterText] = useState('');

  const filteredItems = clients.filter(item =>
    Object.values(item).some(
      val => val && val.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Clients', path: '/clients' },
  ];

  return (
    <div className="container-fluid p-5 mt-4">
      <h1 className="visually-hidden">Liste des clients</h1>

      <Breadcrumb items={breadcrumbItems} />

      {error && <div className="alert alert-danger">{error}</div>}

      <input
        type="text"
        placeholder="Rechercher un client"
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
        fixedHeader
        fixedHeaderScrollHeight="70vh"
        expandableRows
        expandableRowsComponent={({ data }) => (
          <AuditPanel createdAt={data.created_at} updatedAt={data.updated_at} />
        )}  
        expandOnRowClicked
        progressPending={loading}
        customStyles={datatableStyles}
      />
    </div>
  );
}
