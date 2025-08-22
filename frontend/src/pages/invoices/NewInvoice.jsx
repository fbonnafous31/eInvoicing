import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import Breadcrumb from '../../components/Breadcrumb';
import * as invoiceService from '../../services/invoices';

export default function NewInvoice() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateInvoice = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await invoiceService.createInvoice(formData);
      setSuccessMessage("Facture créée avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        setSuccessMessage('');
        navigate('/invoices');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
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
      {/* H1 invisible pour SEO/accessibilité */}
      <h1 className="visually-hidden">Créer une nouvelle facture</h1>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Messages */}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      {/* Formulaire */}
      <InvoiceForm onSubmit={handleCreateInvoice} disabled={isSubmitting} />
    </div>
  );
}
