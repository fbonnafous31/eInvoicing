import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb'; 
import { fetchSellers } from '../../services/sellers';

export default function SellersList() {
  const [sellers, setSellers] = useState([]);
  const [filterText, setFilterText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellers()
      .then(setSellers)
      .catch(err => {
        console.error(err);
        alert("Erreur lors du chargement des vendeurs");
      });
  }, []);

  const columns = [
    {
      name: 'Actions',
      cell: row => (
        <button
          className="btn btn-sm"
          onClick={() => navigate(`/sellers/${row.id}`)}
        >
          ✏️
        </button>
      ),
      ignoreRowClick: true,
      button: true,
      width: '50px',
    },
    { name: 'Identifiant', selector: row => row.legal_identifier, sortable: true, width: '150px' },
    { name: 'Nom légal', selector: row => row.legal_name, sortable: true },
    { name: 'Adresse', selector: row => row.address, sortable: true },
    { name: 'Code postal', selector: row => row.postal_code, sortable: true, width: '100px' },
    { name: 'Ville', selector: row => row.city, sortable: true },
    { name: 'Pays', selector: row => row.country_code, sortable: true, width: '60px' },
    { name: 'Email', selector: row => row.contact_email, sortable: true },
    { name: 'Téléphone', selector: row => row.phone_number || '', sortable: true },
  ];

  // Panneau extensible affichant seulement les dates d'audit
  const ExpandedComponent = ({ data }) => (
    <div className="p-2 bg-light border rounded">
      <p className="mb-1">        
        <span className="text-muted small">
          Créé le {data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'}
        </span>
      </p>
      <p className="mb-0">
        <span className="text-muted small">
          Mis à jour le {data.updated_at ? new Date(data.updated_at).toLocaleDateString() : '—'}
        </span>
      </p>
    </div>
  );

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
      <h1 className="visually-hidden">Liste des vendeurs</h1>

      <Breadcrumb items={breadcrumbItems} />

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
        expandableRowsComponent={ExpandedComponent}
        expandOnRowClicked
        customStyles={{
          table: { style: { border: '1px solid #ddd', borderRadius: '4px' } },
          headRow: { style: { borderBottom: '2px solid #ccc', fontWeight: 'bold' } },
          rows: { style: { borderBottom: '1px solid #eee', minHeight: '50px' } },
          cells: { style: { whiteSpace: 'normal' } },
        }}
      />
    </div>
  );
}
