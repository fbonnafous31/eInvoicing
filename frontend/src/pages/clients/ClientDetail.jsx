import React, { useEffect, useState } from 'react';
import ClientForm from './ClientForm';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { fetchClient, updateClient, deleteClient } from '../../services/clients';
import { EditButton, CancelButton, DeleteButton } from '@/components/ui/buttons';
import { useAuth } from '@/hooks/useAuth'; 

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth(); 

  useEffect(() => {
    let isMounted = true; // ⚡ flag pour éviter les fetch après démontage

    const loadClient = async () => {
      try {
        const token = await getToken({ audience: import.meta.env.VITE_AUTH0_AUDIENCE });
        const data = await fetchClient(id, token);
        if (isMounted) {
          setClient(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Erreur chargement client :", err);
          setLoading(false);
          // si le client n'existe pas, redirige directement
          if (err.message.includes('404')) navigate('/clients');
        }
      }
    };

    loadClient();

    return () => { isMounted = false; }; // cleanup
  }, [id, getToken, navigate]);

  const handleUpdate = async (updatedData) => {
    try {
      const token = await getToken({ audience: import.meta.env.VITE_AUTH0_AUDIENCE });
      const data = await updateClient(id, updatedData, token); 
      setClient(data);
      setIsEditing(false);
      setSuccessMessage("Client mis à jour avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/clients');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer ce client ?')) {
      try {
        const token = await getToken({ audience: import.meta.env.VITE_AUTH0_AUDIENCE });
        await deleteClient(id, token); 
        navigate('/clients');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!client) return <p>Client introuvable.</p>;

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
          <EditButton onClick={() => setIsEditing(true)}>Modifier</EditButton>
        )}
        <DeleteButton onClick={handleDelete} />
      </div>
    </div>
  );
}
