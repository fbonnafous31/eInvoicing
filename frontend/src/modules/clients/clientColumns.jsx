import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';

export default function useClientColumns() {
  const navigate = useNavigate();

  return [
    {
      name: 'Actions',
      cell: row => (
        <button className="btn btn-sm" onClick={() => navigate(`/clients/${row.id}`)}>
          ✏️
        </button>
      ),
      ignoreRowClick: true,
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
      name: 'Nom',
      selector: row => row.is_company ? row.legal_name : `${row.firstname} ${row.lastname}`,
      sortable: true,
      cell: row => <EllipsisCell value={row.is_company ? row.legal_name : `${row.firstname} ${row.lastname}`} />
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
      selector: row => row.email || '',
      sortable: true,
      width: '200px',
      cell: row => <EllipsisCell value={row.email || ''} maxWidth="200px" />
    },
    {
      name: 'Téléphone',
      selector: row => row.phone || '',
      sortable: true,
      width: '120px',
      cell: row => <EllipsisCell value={row.phone || ''} maxWidth="120px" />
    },
    {
      name: 'Type',
      selector: row => row.is_company ? 'Entreprise' : 'Particulier',
      sortable: true,
      width: '120px',
    },
  ];
}
