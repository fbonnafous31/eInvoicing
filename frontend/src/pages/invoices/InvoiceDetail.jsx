// frontend/src/pages/invoices/InvoiceDetail.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/layout/Breadcrumb";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import { fetchInvoice, updateInvoice, deleteInvoice } from "../../services/invoices";
import { useClientService } from "@/services/clients";
import { useAuth } from "../../hooks/useAuth";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const { fetchClient } = useClientService();
  useEffect(() => {
    let isMounted = true;

    const loadInvoice = async () => {
      try {
        const token = await getToken({ audience: import.meta.env.VITE_AUTH0_AUDIENCE });
        const data = await fetchInvoice(id, token);

        if (data.client_id) {
          try {
            const clientData = await fetchClient(data.client_id, token);
            if (isMounted) setInvoice({ ...data, client: clientData });
          } catch {
            if (isMounted) setInvoice(data);
          }
        } else if (isMounted) {
          setInvoice(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadInvoice();

    return () => { isMounted = false; };
    // ⚠️ pas de dépendance sur getToken pour éviter la boucle infinie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // on enlève getToken des dépendances

  const handleUpdate = async (formData) => {
    try {
      const token = await getToken({
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      });

      const updated = await updateInvoice(id, formData, token);

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
      const token = await getToken({
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      });

      await deleteInvoice(id, token);

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
