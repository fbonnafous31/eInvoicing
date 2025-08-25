  // frontend/src/components/invoices/InvoiceForm.jsx
  import React, { useState, useMemo } from "react";
  import { useNavigate } from "react-router-dom";
  import InvoiceHeader from "./InvoiceHeader";
  import InvoiceClient from "./InvoiceClient";
  import InvoiceLines from "./InvoiceLines";
  import TaxBases from "./TaxBases";
  import SupportingDocs from "./SupportingDocs";
  import { createInvoice } from "../../services/invoices";
  import { validateInvoiceField, validateClientData } from "../../utils/validators/invoice";

  export default function InvoiceForm({ onSubmit, disabled }) {
    const navigate = useNavigate();
    const [invoiceData, setInvoiceData] = useState({
      header: {},
      client: {},
      lines: [],
      taxes: [],
      attachments: [],
    });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [headerTouched, setHeaderTouched] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const headerFields = ["invoice_number", "issue_date", "fiscal_year", "seller_id"];

    // Calcul des totaux et TVA
    const { subtotal, totalTaxes, total, linesWithTotals, taxesSummary } = useMemo(() => {
      let st = 0, tt = 0;
      const taxesMap = {};

      const newLines = invoiceData.lines.map(line => {
        const quantity = parseFloat(line.quantity) || 0;
        const unit_price = parseFloat(line.unit_price) || 0;
        const discount = parseFloat(line.discount) || 0;
        const vat_rate = parseFloat(line.vat_rate) || 0;

        const line_net = quantity * unit_price - discount;
        const line_tax = (line_net * vat_rate) / 100;
        const line_total = line_net + line_tax;

        st += line_net;
        tt += line_tax;

        if (vat_rate > 0) {
          if (!taxesMap[vat_rate]) taxesMap[vat_rate] = { vat_rate, base_amount: 0, tax_amount: 0 };
          taxesMap[vat_rate].base_amount += line_net;
          taxesMap[vat_rate].tax_amount += line_tax;
        }

        return { ...line, line_net, line_tax, line_total };
      });

      return {
        subtotal: st,
        totalTaxes: tt,
        total: st + tt,
        linesWithTotals: newLines,
        taxesSummary: Object.values(taxesMap)
      };
    }, [invoiceData.lines]);

    const handleChange = (section, value) => {
      const newData = { ...invoiceData, [section]: value };
      setInvoiceData(newData);

      // Validation dynamique
      if (section === "header") {
        const newErrors = { ...errors };
        headerFields.forEach(f => {
          const err = validateInvoiceField(f, newData.header[f], newData.header);
          if (err) newErrors[f] = err;
          else delete newErrors[f];
        });
        setErrors(newErrors);
      }
      if (section === "client") {
        const newErrors = { ...errors };
        Object.keys(value).forEach(f => {
          const err = validateClientData(f, newData.client);
          if (err) newErrors[f] = err;
          else delete newErrors[f];
        });
        setErrors(newErrors);
      }
    };

    const validateAll = () => {
      const headerErrors = {};
      headerFields.forEach(f => {
        const err = validateInvoiceField(f, invoiceData.header[f], invoiceData.header);
        if (err) headerErrors[f] = err;
      });
      setErrors(prev => ({ ...prev, ...headerErrors }));
      return headerErrors;
    };

    const validateClient = () => {
      const clientErrors = {};
      const clientFields = [
        "client_first_name",
        "client_last_name",
        "client_address",
        "client_siret",
        "client_vat_number",
        "client_legal_name"
      ];
      clientFields.forEach(f => {
        const err = validateClientData(f, invoiceData.client);
        if (err) clientErrors[f] = err;
      });
      setErrors(prev => ({ ...prev, ...clientErrors }));
      return clientErrors;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitted(true);
      setErrorMessage("");

      const headerErrors = validateAll();
      setHeaderTouched(headerFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
      if (Object.keys(headerErrors).length > 0) {
        setErrorMessage("Certains champs obligatoires sont manquants !");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const clientErrors = validateClient();
      if (Object.keys(clientErrors).length > 0) {
        setErrorMessage("Certains champs client sont obligatoires !");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (!invoiceData.lines.length) {
        setErrorMessage("Vous devez ajouter au moins une ligne de facture !");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const mainCount = invoiceData.attachments.filter(a => a.attachment_type === 'main').length;
      if (mainCount !== 1) {
        setErrorMessage("La facture doit avoir un justificatif principal");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      try {
        console.log("Attachments to send:", invoiceData.attachments.map(a => a.raw_file));
        console.log("invoiceData avant FormData:", invoiceData);

        // Création FormData
        const formData = new FormData();

        // fichiers
        invoiceData.attachments.forEach(file => {
          formData.append("attachments", file.raw_file);
        });

        // méta
        formData.append("attachments_meta", JSON.stringify(invoiceData.attachments.map(a => ({
          attachment_type: a.attachment_type
        }))));

        // autres données
        formData.append("invoice", JSON.stringify({
          invoice_number: invoiceData.header.invoice_number,
          issue_date: invoiceData.header.issue_date,
          fiscal_year: invoiceData.header.fiscal_year,
          seller_id: invoiceData.header.seller_id,
          subtotal,
          total_taxes: totalTaxes,
          total
        }));

        formData.append("client", JSON.stringify(invoiceData.client));
        formData.append("lines", JSON.stringify(linesWithTotals));
        formData.append("taxes", JSON.stringify(invoiceData.taxes.length ? invoiceData.taxes : taxesSummary));

        console.log("Payload FormData ready:", formData);

        if (onSubmit) {
          await onSubmit(formData);
        } else {
          await createInvoice(formData);
          setSuccessMessage("Facture créée avec succès ! 🎉");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            setSuccessMessage("");
            navigate("/invoices");
          }, 2000);
        }
      } catch (err) {
        setErrorMessage(err.message || "Erreur lors de la création de la facture");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <InvoiceHeader
          data={invoiceData.header}
          onChange={val => handleChange("header", val)}
          submitted={submitted}
          errors={errors}
          touchedFields={headerTouched}
          setTouchedFields={setHeaderTouched}
        />

        <InvoiceClient
          data={invoiceData.client}
          onChange={val => handleChange("client", val)}
          submitted={submitted}
          errors={errors}
        />

        <InvoiceLines
          data={linesWithTotals}
          onChange={val => handleChange("lines", val)}
        />

        <TaxBases
          data={invoiceData.taxes.length ? invoiceData.taxes : taxesSummary}
          onChange={val => handleChange("taxes", val)}
        />

        <SupportingDocs
          data={invoiceData.attachments}
          onChange={val => handleChange("attachments", val)}
          allowPrincipal
        />

        <div className="card p-3 mb-3">
          <h5>Récapitulatif</h5>
          <p>Montant HT : {subtotal.toFixed(2)} €</p>
          <p>Total TVA : {totalTaxes.toFixed(2)} €</p>
          <p>Total TTC : {total.toFixed(2)} €</p>
        </div>

        <div className="d-flex justify-content-end mt-3 mb-3 me-3">
          <button type="submit" className="btn btn-primary" disabled={disabled}>
            Créer la facture
          </button>
        </div>
      </form>
    );
  }
