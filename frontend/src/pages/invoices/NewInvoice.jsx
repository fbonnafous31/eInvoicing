import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import Breadcrumb from '../../components/layout/Breadcrumb';
import { useInvoiceService } from "@/services/invoices";

export default function NewInvoice() {
  const navigate = useNavigate();
  const invoiceService = useInvoiceService();

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateInvoice = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Création via le service, token géré automatiquement
      await invoiceService.createInvoice(formData);

      setSuccessMessage("Facture créée avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        setSuccessMessage('');
        navigate("/invoices");
      }, 2000);

    } catch (error) {
      const backendMessage = error.message || "Erreur lors de la création de la facture";
      setErrorMessage(backendMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });

    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Factures', path: '/invoices' },
    { label: 'Nouvelle facture', path: '/invoices/new' },
  ];

  return (
    <div className="container mt-4">
      <h1 className="visually-hidden">Créer une nouvelle facture</h1>

      <Breadcrumb items={breadcrumbItems} />

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <InvoiceForm onSubmit={handleCreateInvoice} disabled={isSubmitting} />
    </div>
  );
}
