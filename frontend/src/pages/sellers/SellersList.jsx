import React, { useState } from 'react';
import DataTable from 'react-data-table-component';
import Breadcrumb from '../../components/layout/Breadcrumb';
import useSellers from '../../modules/sellers/useSellers';
import useSellerColumns from '../../modules/sellers/sellerColumns';
import { datatableStyles } from '../../modules/common/datatableStyles'; // <== correction
import AuditPanel from '../../components/common/AuditPanel';

export default function SellersList() {
  const { sellers, loading, error } = useSellers();
  const columns = useSellerColumns();
  const [filterText, setFilterText] = useState('');

  const filteredItems = sellers.filter(item => 
    Object.values(item).some(
      val => val && val.toString().toLowerCase().includes(filterText.toLowerCase())
    )
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
        expandableRowsComponent={({ data }) => (
          <AuditPanel createdAt={data.created_at} updatedAt={data.updated_at} />
        )}        
        expandOnRowClicked
        progressPending={loading}
        customStyles={datatableStyles} // <== correction
      />
    </div>
  );
}
