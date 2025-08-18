import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientForm from '../clients/ClientForm';
import Breadcrumb from '../../components/Breadcrumb';
import { createClient } from '../../services/clients'; // <-- import du service

export default function NewClient() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClient = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await createClient(formData); // <-- appel au service

      setSuccessMessage("Client créé avec succès ! 🎉");

      setTimeout(() => {
        setSuccessMessage('');
        navigate('/clients');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Clients', path: '/clients' },
    { label: 'Nouveau client', path: '/clients/new' },
  ];

  return (
    <div className="container mt-4">
      {/* H1 invisible pour SEO/accessibilité */}
      <h1 className="visually-hidden">Créer un nouveau client</h1>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

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
      <ClientForm onSubmit={handleCreateClient} disabled={isSubmitting} />
    </div>
  );
}
