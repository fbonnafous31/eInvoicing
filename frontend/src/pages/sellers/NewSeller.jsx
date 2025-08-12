import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerForm from '../sellers/SellerForm';

export default function NewSeller() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSeller = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch("http://localhost:3000/api/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Erreur lors de la création du vendeur");
      
      setSuccessMessage("Vendeur créé avec succès ! 🎉");

      setTimeout(() => {
        setSuccessMessage('');
        navigate('/sellers');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Créer un nouveau vendeur</h1>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <SellerForm onSubmit={handleCreateSeller} disabled={isSubmitting} />
    </div>
  );
}
