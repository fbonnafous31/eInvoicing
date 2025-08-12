import React from 'react';
import SellerForm from '../sellers/SellerForm';

export default function NewSeller() {
  async function handleCreateSeller(data) {
    try {
      const response = await fetch('http://localhost:3000/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erreur lors de la création du vendeur');

      const newSeller = await response.json();
      console.log('Vendeur créé:', newSeller);
      // Tu peux ajouter une redirection ou un message de succès ici
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création du vendeur');
    }
  }

  return (
    <div>
      <h1>Créer un nouveau vendeur</h1>
      <SellerForm onSubmit={handleCreateSeller} />
    </div>
  );
}
