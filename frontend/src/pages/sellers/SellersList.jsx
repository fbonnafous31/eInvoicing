import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';

export default function SellersList() {
  const [sellers, setSellers] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/sellers')
      .then(res => res.json())
      .then(data => setSellers(data))
      .catch(console.error);
  }, []);

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
 ];

  const filteredItems = sellers.filter(item => {
    const search = filterText.toLowerCase();
    return (
      (item.legal_name && item.legal_name.toLowerCase().includes(search)) ||
      (item.legal_identifier && item.legal_identifier.toLowerCase().includes(search)) ||
      (item.address && item.address.toLowerCase().includes(search)) ||
      (item.postal_code && item.postal_code.toLowerCase().includes(search)) ||
      (item.city && item.city.toLowerCase().includes(search))
    );
  });

  return (
    <div className="container mt-4">
      <h2>Liste des vendeurs</h2>

      <input
        type="text"
        placeholder="Rechercher un vendeur..."
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
          table: {
            style: {
              border: '1px solid #ddd',
              borderRadius: '4px',
            },
          },
          headRow: {
            style: {
              borderBottom: '2px solid #ccc',
            },
          },
          rows: {
            style: {
              borderBottom: '1px solid #eee',
            },
          },
        }}
      />
    </div>
  );
}
