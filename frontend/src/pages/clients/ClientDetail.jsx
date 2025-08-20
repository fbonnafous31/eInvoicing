// ClientDetail.jsx
import React, { useEffect, useState } from 'react';
import ClientForm from './ClientForm';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import { fetchClient, updateClient, deleteClient } from '../../services/clients';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchClient(id)
      .then(data => setClient(data))
      .catch(console.error);
  }, [id]);

  const handleUpdate = (updatedData) => {
    updateClient(id, updatedData)
      .then(data => {
        setClient(data);           
        setIsEditing(false);       
        setSuccessMessage("Client mis à jour avec succès ! 🎉"); 
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/clients');
        }, 2000);        
      })
      .catch(console.error);
  };

  const handleDelete = () => {
    if (window.confirm('Voulez-vous vraiment supprimer ce client ?')) {
      deleteClient(id)
        .then(() => navigate('/clients'))
        .catch(console.error);
    }
  };

  if (!client) return <p>Chargement...</p>;

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Clients', path: '/clients' },
    { label: client.legal_name || 'Détail', path: `/clients/${id}` },
  ];

  return (
    <div className="container mt-4">
      <Breadcrumb items={breadcrumbItems} />

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <ClientForm
        onSubmit={isEditing ? handleUpdate : undefined}
        disabled={!isEditing}
        initialData={client}
      />

      <div className="mt-3 d-flex justify-content-end gap-2">
        {isEditing ? (
          <button className="btn btn-success" onClick={() => setIsEditing(false)}>
            Annuler
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            ✏️ Modifier
          </button>
        )}
        <button className="btn btn-danger ms-2" onClick={handleDelete}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
