// frontend/src/pages/invoices/InvoiceDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import { fetchInvoice, updateInvoice } from "../../services/invoices";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchInvoice(id)
      .then(data => {
        console.log("Fetched invoice:", data);
        setInvoice(data);
      })
      .catch(console.error);
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      console.log("handleUpdate called with:", formData);
      const updated = await updateInvoice(id, formData);
      setInvoice(updated);
      setIsEditing(false);
      setSuccessMessage("Facture mise à jour avec succès ! 🎉");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la facture");
    }
  };

  if (!invoice) return <p>Chargement...</p>;

  console.log("Fetched invoice:", invoice); 
  const mapClientForForm = (invoiceData) => {
    if (!invoiceData || !invoiceData.client) return {};

    const c = invoiceData.client;

    return {
      client_id: invoiceData.client_id || null, 
      client_legal_name: c.legal_name || "",
      client_address: c.address || "",
      client_city: c.city || "",
      client_postal_code: c.postal_code || "",
      client_country_code: c.country_code || "FR",
      client_email: c.email || "",
      client_phone: c.phone || "",
      client_first_name: c.first_name || "",
      client_last_name: c.last_name || "",
      client_siret: c.legal_identifier_type === "SIRET" ? c.legal_identifier : "",
      client_vat_number: c.legal_identifier_type === "VAT" ? c.legal_identifier : "",
      client_type: c.legal_identifier_type === "Nom" ? "individual" : c.legal_identifier_type === "SIRET" ? "company_fr" : "company_eu",
    };
  };

  const mappedClient = mapClientForForm(invoice);

  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: "Factures", path: "/invoices" },
    { label: invoice.invoice_number || "Détail", path: `/invoices/${id}` },
  ];

  return (
    <div className="container mt-4">
      <Breadcrumb items={breadcrumbItems} />

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <InvoiceForm
        onSubmit={handleUpdate}
        disabled={isEditing}
        setIsEditing={setIsEditing}
        initialData={{
          id: invoice.id,
          status: invoice.status,
          header: {
            invoice_number: invoice.invoice_number,
            issue_date: invoice.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : '',
            supply_date: invoice.supply_date ? new Date(invoice.supply_date).toISOString().split('T')[0] : '',
            fiscal_year: invoice.fiscal_year,
            seller_id: invoice.seller_id,
            contract_number: invoice.contract_number,
            purchase_order_number: invoice.purchase_order_number,
            payment_terms: invoice.payment_terms,
          },
          client: mappedClient,
          lines: invoice.lines || [],
          taxes: invoice.taxes || [],
          attachments: invoice.attachments || [],
        }}
      />
    </div>
  );
}
