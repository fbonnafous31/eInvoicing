import React, { useEffect, useState } from 'react';
import SellerForm from './SellerForm';
import { useParams } from 'react-router-dom';

export default function SellerDetail() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
    })
    .catch(console.error);
  };

  if (!seller) return <p>Chargement...</p>;

  return (
    <div className="container mt-4">
      <h2>Détails du vendeur</h2>

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
        <button className="btn btn-danger" onClick={() => alert('Suppression non implémentée')}>
          Supprimer
        </button>
      </div>
    </div>   
  );
}
