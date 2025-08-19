// frontend/src/modules/sellers/sellerColumns.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';

export default function useSellerColumns() {
  const navigate = useNavigate();

  return [
    {
      name: 'Actions',
      cell: row => (
        <button className="btn btn-sm" onClick={() => navigate(`/sellers/${row.id}`)}>
          ✏️
        </button>
      ),
      ignoreRowClick: true,
      button: true,
      width: '50px',
    },
    { 
      name: 'Identifiant', 
      selector: row => row.legal_identifier, 
      sortable: true, 
      width: '150px',
      cell: row => <EllipsisCell value={row.legal_identifier} maxWidth="150px" />
    },
    { 
      name: 'Nom légal', 
      selector: row => row.legal_name, 
      sortable: true,
      cell: row => <EllipsisCell value={row.legal_name} />
    },
    { 
      name: 'Adresse', 
      selector: row => row.address, 
      sortable: true,
      cell: row => <EllipsisCell value={row.address} />
    },
    { 
      name: 'Code postal', 
      selector: row => row.postal_code, 
      sortable: true, 
      width: '120px',
      cell: row => <EllipsisCell value={row.postal_code} maxWidth="120px" />
    },
    { 
      name: 'Ville', 
      selector: row => row.city, 
      sortable: true,
      cell: row => <EllipsisCell value={row.city} />
    },
    { 
      name: 'Pays', 
      selector: row => row.country_code, 
      sortable: true, 
      width: '100px',
      cell: row => <EllipsisCell value={row.country_code} maxWidth="100px" />
    },
    { 
      name: 'Email', 
      selector: row => row.contact_email, 
      sortable: true, 
      width: '200px',
      cell: row => <EllipsisCell value={row.contact_email} maxWidth="200px" />
    },
    { 
      name: 'Téléphone', 
      selector: row => row.phone_number || '', 
      sortable: true, 
      width: '120px',
      cell: row => <EllipsisCell value={row.phone_number || ''} maxWidth="120px" />
    },
  ];
}
