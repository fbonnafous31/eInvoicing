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

<<<<<<< HEAD
  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Clients', path: '/clients' },
  ];

  return (
    <div className="container-fluid p-5 mt-4">
      <h1 className="visually-hidden">Liste des clients</h1>

      <Breadcrumb items={breadcrumbItems} />

      {error && <div className="alert alert-danger">{error}</div>}
=======
  const columns = [
    {
      name: 'Identifiant',
      selector: row => row.legal_identifier,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Nom légal',
      selector: row => row.legal_name,
      sortable: true,
    },
    {
      name: 'Adresse',
      selector: row => row.address,
      sortable: true,
    },   
    {
      name: 'Code postal',
      selector: row => row.postal_code,
      sortable: true,
    },       
    {
      name: 'Ville',
      selector: row => row.city,
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <button
          className="btn btn-sm"
          onClick={() => navigate(`/clients/${row.id}`)}
        >
          ✏️
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,       
      button: true,      
      style: { textAlign: 'right' }
    },    
 ];

  const filteredItems = clients.filter(item => {
    const search = filterText.toLowerCase();
    return Object.values(item).some(
      val => val && val.toString().toLowerCase().includes(search)
    );
  });

  return (
    <div className="container-fluid mt-4">
      <h2>Liste des clients</h2>
>>>>>>> 5f08e77 (Jour 13 : liste des factures frontend, helpers et tooltips, stratégie de travail avec ChatGPT)

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
