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
      name: 'ID',
      selector: row => row.id,
      sortable: true,
      width: '80px',
    },
    {
      name: 'Nom légal',
      selector: row => row.legal_name,
      sortable: true,
    },
    {
      name: 'Ville',
      selector: row => row.city,
      sortable: true,
    },
  ];

  const filteredItems = sellers.filter(
    item =>
      item.legal_name && item.legal_name.toLowerCase().includes(filterText.toLowerCase())
  );

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
