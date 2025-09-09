// frontend/src/pages/invoices/InvoiceDetail.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/layout/Breadcrumb";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import { useInvoiceService } from "@/services/invoices";
import { useClientService } from "@/services/clients";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const { fetchInvoice } = useInvoiceService();
  const { fetchClient } = useClientService();  
  const invoiceService = useInvoiceService();
  useEffect(() => {
    console.log("useEffect InvoiceDetail déclenché");
    if (!id) return;
    let isMounted = true;

    const loadInvoice = async () => {
      try {
        // fetchInvoice gère maintenant le token automatiquement
        let invoiceData = await fetchInvoice(id);

        if (invoiceData.client_id) {
          try {
            const clientData = await fetchClient(invoiceData.client_id);
            if (isMounted) invoiceData = { ...invoiceData, client: clientData };
          } catch (err) {
            console.error("Erreur fetch client :", err);
          }
        }

        if (isMounted) setInvoice(invoiceData);
      } catch (err) {
        console.error("Erreur fetch invoice :", err);
      }
    };

    loadInvoice();

    return () => { isMounted = false; };
  }, [id, fetchInvoice, fetchClient]); // ⚡ dépendances correctes

  const handleUpdate = async (formData) => {
    try {
      // updateInvoice gère automatiquement le token
      const updated = await invoiceService.updateInvoice(id, formData);

      setInvoice(updated);
      setIsEditing(false);
      setSuccessMessage("Facture mise à jour avec succès ! 🎉");

      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err) {
      console.error("Erreur update invoice:", err);
      alert("Erreur lors de la mise à jour de la facture");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette facture ?")) return;

    try {
      await invoiceService.deleteInvoice(id); // token géré automatiquement
      alert("Facture supprimée avec succès !");
      navigate("/invoices");
    } catch (err) {
      console.error("Erreur delete invoice:", err);
      alert(err.message || "Erreur lors de la suppression de la facture");
    }
  };

  // Mapping client
  const mappedClient = useMemo(() => {
    if (!invoice) return {};
    const c = invoice.client || {};
    return {
      client_id: invoice.client_id || null,
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
  }, [invoice]);

  // Memoized initialData
  const initialData = useMemo(() => {
    if (!invoice) return null;
    return {
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
    };
  }, [invoice, mappedClient]);

  if (!invoice || !initialData) return <p>Chargement...</p>;

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
        initialData={initialData}
      />
    </div>
  );
}
