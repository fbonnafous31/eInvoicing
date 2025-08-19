// frontend/src/pages/SellersPage.jsx
import React, { useState, useEffect } from 'react';
import SellersList from '../modules/sellers/SellersList';
import SellerForm from '../modules/sellers/SellerForm';
import { fetchSellers, createSeller } from '../services/sellers';

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSellers() {
      try {
        const data = await fetchSellers();
        setSellers(data);
      } catch (err) {
        console.error(err);
        setErrorMessage('Erreur lors du chargement des vendeurs');
      }
    }
    loadSellers();
  }, []);

  const handleSellerCreated = async (formData) => {
    try {
      const newSeller = await createSeller(formData);
      setSellers(prev => [newSeller, ...prev]);
    } catch (err) {
      console.error(err);
      setErrorMessage('Erreur lors de la création du vendeur');
    }
  };

  return (
    <div className="container-fluid mt-4">
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      <h2>Créer un vendeur</h2>
      <SellerForm onSubmit={handleSellerCreated} />

      <hr />

      <h2>Liste des vendeurs</h2>
      <SellersList sellers={sellers} />
    </div>
  );
}
