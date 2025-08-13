import React, { useEffect, useState } from 'react';
import ClientForm from './ClientForm';
import { useParams, useNavigate } from 'react-router-dom';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch(`http://localhost:3000/api/clients/${id}`)
      .then(res => res.json())
      .then(data => setClient(data))
      .catch(console.error);
  }, [id]);

  const handleUpdate = (updatedData) => {
    fetch(`http://localhost:3000/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    })
      .then(res => res.json())
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

  if (!client) return <p>Chargement...</p>;

  return (
    <div className="container mt-4">
      <h2>Détails du client</h2>

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
        <button
          className="btn btn-danger ms-2"
          onClick={() => {
            if (window.confirm('Voulez-vous vraiment supprimer ce client ?')) {
              fetch(`http://localhost:3000/api/clients/${id}`, { method: 'DELETE' })
                .then(() => navigate('/clients'))
                .catch(console.error);
            }
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
