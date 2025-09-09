// frontend/src/pages/clients/ClientDetail.jsx
import React, { useEffect, useState } from 'react';
import ClientForm from './ClientForm';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { useClientService } from "@/services/clients";
import { EditButton, CancelButton, DeleteButton } from '@/components/ui/buttons';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // ⚡ Une seule instance stable
  const clientService = useClientService();

  // ----------------------
  // Chargement client
  // ----------------------
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadClient = async () => {
      try {
        const data = await clientService.fetchClient(id);
        if (!isMounted) return;
        setClient(data);
      } catch (err) {
        console.error("Erreur chargement client :", err);
        if (err.message.includes("404")) navigate("/clients");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadClient();

    return () => { isMounted = false; };
  }, [id, navigate, clientService]);

  // ----------------------
  // Update client
  // ----------------------
  const handleUpdate = async (updatedData) => {
    try {
      const data = await clientService.updateClient(id, updatedData);
      setClient(data);
      setIsEditing(false);
      setSuccessMessage("Client mis à jour avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Redirection après un court délai
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/clients');   
      }, 1500);
    } catch (err) {
      console.error("Erreur mise à jour client :", err);
      alert("Erreur lors de la mise à jour du client");
    }
  };

  // ----------------------
  // Supprimer client
  // ----------------------
  const handleDelete = async () => {
    console.log("Suppression client", id);
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return;

    try {
      await clientService.deleteClient(id); 
      navigate('/clients');
    } catch (err) {
      console.error("Erreur suppression client :", err);
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
        <DeleteButton type="button" onClick={handleDelete} />
      </div>
    </div>
  );
}
