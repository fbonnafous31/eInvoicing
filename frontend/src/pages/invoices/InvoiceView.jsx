// frontend/src/pages/invoices/InvoiceView.jsx
import { useParams } from "react-router-dom";
import InvoiceForm from "../../components/invoices/InvoiceForm";
import PdfViewer from "../../components/invoices/PdfViewer";
import { useEffect, useState } from "react";
import { fetchInvoice } from "../../services/invoices";
import { fetchClient } from "../../services/clients";

const InvoiceView = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (id) {
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
    }
  }, [id]);

  if (!invoice) return <div>Chargement...</div>;

  // Mapping client pour InvoiceForm
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

  const invoiceFormData = {
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
    },
    client: mappedClient,
    lines: invoice.lines || [],
    taxes: invoice.taxes || [],
    attachments: invoice.attachments || [],
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        height: "100vh",
        padding: "20px",
        width: "100vw",
        boxSizing: "border-box",
      }}
    >
      {/* Partie gauche : détails */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",    // scroll si contenu dépasse
          paddingRight: "10px",
        }}
      >
        <InvoiceForm initialData={invoiceFormData} readOnly />
      </div>

      {/* Partie droite : PDF */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",    // scroll si PDF long
          paddingLeft: "10px",
          borderLeft: "1px solid #ccc"
        }}
      >
        <PdfViewer fileUrl={`/uploads/${invoice.pdfFilename}`} />
      </div>
    </div>
  );
};

export default InvoiceView;
