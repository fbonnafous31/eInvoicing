import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientForm from '../clients/ClientForm';

export default function NewClient() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClient = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch("http://localhost:3000/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Erreur lors de la création du client");
      
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

  return (
    <div className="container mt-4 d-flex flex-column align-items-center">
      <h1>Créer un nouveau client</h1>
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
        <ClientForm onSubmit={handleCreateClient} disabled={isSubmitting} />
    </div>    
  );
}
