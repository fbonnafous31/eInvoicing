import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb'; 
import { fetchSellers } from '../../services/sellers'; // <-- import du service

export default function SellersList() {
  const [sellers, setSellers] = useState([]);
  const [filterText, setFilterText] = useState('');
  const navigate = useNavigate();

  // Utilisation du service
  useEffect(() => {
    fetchSellers()
      .then(setSellers)
      .catch(err => {
        console.error(err);
        alert("Erreur lors du chargement des vendeurs");
      });
  }, []);

  const columns = [
    { name: 'Identifiant', selector: row => row.legal_identifier, sortable: true, width: '150px' },
    { name: 'Nom légal', selector: row => row.legal_name, sortable: true },
    { name: 'Adresse', selector: row => row.address, sortable: true },
    { name: 'Code postal', selector: row => row.postal_code, sortable: true },
    { name: 'Ville', selector: row => row.city, sortable: true },
    {
      name: 'Actions',
      cell: row => (
        <button className="btn btn-sm" onClick={() => navigate(`/sellers/${row.id}`)}>
          ✏️
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      style: { textAlign: 'right' }
    },
  ];

  const filteredItems = sellers.filter(item => {
    const search = filterText.toLowerCase();
    return Object.values(item).some(
      val => val && val.toString().toLowerCase().includes(search)
    );
  });

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Vendeurs', path: '/sellers' },
  ];

  return (
    <div className="container-fluid mt-4">
      {/* H1 invisible pour SEO/accessibilité */}
      <h1 className="visually-hidden">Liste des vendeurs</h1>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Filtre de recherche */}
      <input
        type="text"
        placeholder="Rechercher un vendeur"
        className="form-control mb-3"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        style={{ maxWidth: '300px' }}
      />

      {/* Tableau */}
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
          table: { style: { border: '1px solid #ddd', borderRadius: '4px' } },
          headRow: { style: { borderBottom: '2px solid #ccc' } },
          rows: { style: { borderBottom: '1px solid #eee' } },
        }}
      />
    </div>
  );
}
