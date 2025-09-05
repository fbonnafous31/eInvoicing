// frontend/src/pages/invoices/InvoiceDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../../components/layout/Breadcrumb";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import { fetchInvoice, updateInvoice } from "../../services/invoices";
import { fetchClient } from "../../services/clients"; 
import { deleteInvoice } from '../../services/invoices';
import { useNavigate } from 'react-router-dom';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoice(id)
      .then(async data => {
        if (data.client_id) {
          try {
            const clientData = await fetchClient(data.client_id);
            setInvoice({ ...data, client: clientData });
          } catch (err) {
            console.error("Erreur fetch client:", err);
            setInvoice(data); 
          }
        } else {
          setInvoice(data);
        }
      })
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

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette facture ?")) return;

    try {
      await deleteInvoice(id);
      alert("Facture supprimée avec succès !");
      navigate("/invoices"); // redirection vers la liste
    } catch (err) {
      alert(err.message);
    }
  };

  if (!invoice) return <p>Chargement...</p>;

  const mapClientForForm = (invoiceData) => {
    const c = invoiceData.client || {};

    return {
      client_id: invoiceData.client_id || null,
      client_legal_name: c.legal_name || "",
      client_address: c.address || "",
      client_city: c.city || "",
      client_postal_code: c.postal_code || "",
      client_country_code: c.country_code || "FR",
      client_email: c.email || "",
      client_phone: c.phone || "",
      client_first_name: c.firstname || "",
      client_last_name: c.lastname || "",
      client_siret: c.legal_identifier_type === "SIRET" ? c.legal_identifier : c.siret || "",
      client_vat_number: c.legal_identifier_type === "VAT" ? c.legal_identifier : c.vat_number || "",
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
        onDelete={handleDelete}
        disabled={isEditing}
        setIsEditing={setIsEditing}
        initialData={{
          id: invoice.id,
          status: invoice.status,
          header: {
            invoice_number: invoice.invoice_number,
            issue_date: invoice.issue_date,
            supply_date: invoice.supply_date,
            fiscal_year: invoice.fiscal_year,
            seller_id: invoice.seller_id,
            contract_number: invoice.contract_number,
            purchase_order_number: invoice.purchase_order_number,
            payment_terms: invoice.payment_terms,
            payment_method: invoice.payment_method,
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
