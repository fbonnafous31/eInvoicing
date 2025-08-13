import React, { useEffect, useState } from 'react';
import SellerForm from './SellerForm';
import { useParams, useNavigate } from 'react-router-dom';

export default function SellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch(`http://localhost:3000/api/sellers/${id}`)
      .then(res => res.json())
      .then(data => setSeller(data))
      .catch(console.error);
  }, [id]);

  const handleUpdate = (updatedData) => {
    fetch(`http://localhost:3000/api/sellers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    })
      .then(res => res.json())
      .then(data => {
        setSeller(data);           
        setIsEditing(false);       
        setSuccessMessage("Vendeur mis à jour avec succès ! 🎉"); 
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/sellers');
        }, 2000);        
      })
      .catch(console.error);
  };

  if (!seller) return <p>Chargement...</p>;

  return (
    <div className="container mt-4">
      <h2>Détails du vendeur</h2>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <SellerForm
        onSubmit={isEditing ? handleUpdate : undefined}
        disabled={!isEditing}
        initialData={seller}
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
            if (window.confirm('Voulez-vous vraiment supprimer ce vendeur ?')) {
              fetch(`http://localhost:3000/api/sellers/${id}`, { method: 'DELETE' })
                .then(() => navigate('/sellers'))
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
