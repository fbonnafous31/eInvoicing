// src/components/invoices/InvoiceEmailButton.jsx
import React, { useState } from 'react';
import EmailModal from './EmailModal';

export default function InvoiceEmailButton({ row, sendInvoiceMail }) {
  const [showModal, setShowModal] = useState(false);

  const handleSend = async ({ to, subject, message }) => {
    try {
      await sendInvoiceMail(row.id, { message, subject, to });
      alert('📧 Facture envoyée par email !');
    } catch (err) {
      console.error(err);
      alert(`❌ Erreur lors de l'envoi : ${err.message}`);
    }
  };

  const clientName = row.client?.legal_name || 'Client';
  const sellerName = row.seller?.legal_name || 'Votre société';
  const invoiceNumber = row.invoice_number || '';

  const defaultValues = {
    to: row.client?.email || '',
    subject: `Votre facture n°${invoiceNumber}`,
    message: `Bonjour ${clientName},

Nous espérons que vous allez bien.
Veuillez trouver ci-joint votre facture n°${invoiceNumber}.

Si vous avez la moindre question, n'hésitez pas à nous contacter.

Cordialement,
${sellerName}`,
  };

  return (
    <>
      <button
        className="btn btn-sm btn-link p-0 m-0 align-middle text-decoration-none ml-2"
        title="Envoyer la facture par email"
        onClick={() => setShowModal(true)}
      >
        ✉️
      </button>

      <EmailModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSend={handleSend}
        defaultValues={defaultValues}
      />
    </>
  );
}
