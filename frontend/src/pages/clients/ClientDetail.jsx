// ClientDetail.jsx
import React, { useEffect, useState } from 'react';
import ClientForm from './ClientForm';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { fetchClient, updateClient, deleteClient } from '../../services/clients';
import { EditButton, CancelButton, DeleteButton } from '@/components/ui/buttons';

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
        window.scrollTo({ top: 0, behavior: "smooth" });
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

      <div className="mt-4 mb-5 d-flex justify-content-end gap-2">
        {isEditing ? (
          <CancelButton onClick={() => setIsEditing(false)} />
        ) : (
          <EditButton onClick={() => setIsEditing(true)}>
            Modifier
          </EditButton>
        )}
        <DeleteButton onClick={handleDelete} />
      </div>
    </div>
  );
}
