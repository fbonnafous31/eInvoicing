import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerForm from '../sellers/SellerForm';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { createSeller } from '../../services/sellers'; // <-- import du service

export default function NewSeller() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSeller = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await createSeller(formData); // <-- utilisation du service

      setSuccessMessage("Vendeur créé avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" }); 

      setTimeout(() => {
        setSuccessMessage('');
        navigate('/sellers');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message || "Erreur lors de la création du vendeur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Vendeurs', path: '/sellers' },
    { label: 'Nouveau vendeur', path: '/sellers/new' },
  ];

  return (
    <div className="container mt-4">
      {/* H1 invisible pour SEO/accessibilité */}
      <h1 className="visually-hidden">Créer un nouveau vendeur</h1>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Messages */}
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

      {/* Formulaire */}
      <SellerForm onSubmit={handleCreateSeller} disabled={isSubmitting} />
    </div>
  );
}
