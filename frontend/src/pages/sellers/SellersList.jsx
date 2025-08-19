import React, { useState } from 'react';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/Breadcrumb';
import useSellers from '../../hooks/useSellers';
import useSellerColumns from '../../modules/sellers/sellerColumns';
import { sellerTableStyles } from '../../modules/sellers/datatableStyles';
import SellerAuditPanel from '../../components/common/SellerAuditPanel';

export default function SellersList() {
  const { sellers, loading, error } = useSellers();
  const columns = useSellerColumns();
  const [filterText, setFilterText] = useState('');

  const filteredItems = sellers.filter(item => 
    Object.values(item).some(val => val && val.toString().toLowerCase().includes(filterText.toLowerCase()))
  );

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Vendeurs', path: '/sellers' },
  ];

  return (
    <div className="container-fluid mt-4">
      <h1 className="visually-hidden">Liste des vendeurs</h1>

      <Breadcrumb items={breadcrumbItems} />

      {error && <div className="alert alert-danger">{error}</div>}

      <input
        type="text"
        placeholder="Rechercher un vendeur"
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
        expandableRowsComponent={row => (
          <SellerAuditPanel createdAt={row.created_at} updatedAt={row.updated_at} />
        )}
        expandOnRowClicked
        progressPending={loading}
        customStyles={sellerTableStyles}
      />
    </div>
  );
}
