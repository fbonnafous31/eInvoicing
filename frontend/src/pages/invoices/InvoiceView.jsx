// frontend/src/pages/invoices/InvoiceView.jsx
import { useParams } from "react-router-dom";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import Breadcrumb from "../../components/layout/Breadcrumb";
import InvoiceTabs from "../../components/invoices/InvoiceTabs";
import { useEffect, useState, useMemo } from "react";
import { fetchInvoice } from "../../services/invoices";
import { useClientService } from "@/services/clients";
import { useAuth } from "../../hooks/useAuth";

const InvoiceView = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();

  // Chargement des données
  const { fetchClient } = useClientService();
  useEffect(() => {
    if (!id) return;

    const loadInvoice = async () => {
      try {
        const token = await getToken({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });

        let invoiceData = await fetchInvoice(id, token);

        // Récup client si nécessaire
        if (invoiceData.client_id) {
          try {
            const clientData = await fetchClient(invoiceData.client_id, token);
            invoiceData = { ...invoiceData, client: clientData };
          } catch (err) {
            console.error("Erreur fetch client:", err);
          }
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error("Erreur fetch invoice:", err);
      }
    };

    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // Données pour InvoiceForm
  const invoiceFormData = useMemo(() => {
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

  // Loading
  if (!invoice || !invoiceFormData) return <div>Chargement...</div>;

  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: "Factures", path: "/invoices" },
    { label: invoice.invoice_number, path: `/invoices/${id}` },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw", boxSizing: "border-box", padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          height: "calc(100% - 60px)",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "10px" }}>
          <InvoiceForm initialData={invoiceFormData} readOnly />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingLeft: "10px",
            borderLeft: "1px solid #ccc"
          }}
        >
          <InvoiceTabs attachments={invoice.attachments} backendUrl={BACKEND_URL} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
