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
      .then(data => setInvoice(data))
      .catch(console.error);
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
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

    const mapClientForForm = (client) => {
    if (!client) return {};

    switch (client.legal_identifier_type) {
        case "NAME": { // particulier
        const [firstName, ...rest] = client.legal_identifier
            ? client.legal_identifier.split(" ")
            : ["", ""];
        return {
            client_first_name: firstName,
            client_last_name: rest.join(" "),
            client_address: client.address || "",
            client_legal_name: client.legal_name || "",
            client_vat_number: "",
            client_siret: "",
        };
        }
        case "SIRET": // entreprise FR
        return {
            client_first_name: "",
            client_last_name: "",
            client_address: client.address || "",
            client_legal_name: client.legal_name || "",
            client_vat_number: "",
            client_siret: client.legal_identifier || "",
        };
        case "VAT": // entreprise étrangère
        return {
            client_first_name: "",
            client_last_name: "",
            client_address: client.address || "",
            client_legal_name: client.legal_name || "",
            client_vat_number: client.legal_identifier || "",
            client_siret: "",
        };
        default:
        return {};
    }
    };

  const mappedClient = mapClientForForm(invoice.client);

  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: "Factures", path: "/invoices" },
    { label: invoice.invoice_number || "Détail", path: `/invoices/${id}` },
  ];

  console.log("Invoice fetched:", invoice);
  console.log("Mapped client:", mappedClient);

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
        disabled={!isEditing}
        initialData={{
          header: {
            invoice_number: invoice.invoice_number,
            issue_date: invoice.issue_date,
            fiscal_year: invoice.fiscal_year,
            seller_id: invoice.seller_id,
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
