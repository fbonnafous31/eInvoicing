import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceLines from "./InvoiceLines";
import TaxBases from "./TaxBases";
import SupportingDocs from "./SupportingDocs";
import { createInvoice } from "../../services/invoices";
import { validateInvoiceField, validateClientData} from "../../utils/validators/invoice";


export default function InvoiceForm({ onSubmit, disabled }) {
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState({
    header: {},
    lines: [],
    taxes: [],
    attachments: []
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [headerTouched, setHeaderTouched] = useState({});

  const headerFields = ["invoice_number","issue_date","fiscal_year","seller_id"];

  // Calcul des totaux
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
    let newData;

    if (section === "header") {
      newData = { ...invoiceData, header: { ...invoiceData.header, ...value } };
    } else if (section === "attachments") {
      newData = { ...invoiceData, attachments: value };
    } else {
      newData = { ...invoiceData, [section]: value };
    }

    setInvoiceData(newData);
    console.log(`handleChange -> new ${section}:`, newData[section]);

    // Validation header si nécessaire
    if (section === "header") {
      const newErrors = { ...errors };
      headerFields.forEach(f => {
        const err = validateInvoiceField(f, newData.header[f], newData.header);
        if (err) newErrors[f] = err;
        else delete newErrors[f];
      });
      setErrors(newErrors);
    }
  };

  // Validation globale
  const validateAll = () => {
    const headerErrors = {};
    headerFields.forEach(f => {
      const err = validateInvoiceField(f, invoiceData.header[f], invoiceData.header);
      if (err) headerErrors[f] = err;
    });
    setErrors(headerErrors);
    return headerErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMessage("");

    // Validation globale header
    const headerErrors = validateAll();
    setHeaderTouched(headerFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));

    if (Object.keys(headerErrors).length > 0) {
      setErrorMessage("Certains champs obligatoires sont manquants !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const clientErrors = {};
    const clientFields = [
      "client_first_name",
      "client_last_name",
      "client_address",
      "client_siret",
      "client_vat_number"
    ];

    clientFields.forEach(f => {
      const err = validateClientData(f, invoiceData.header); 
      if (err) clientErrors[f] = err;
    });

    if (Object.keys(clientErrors).length > 0) {
      setErrorMessage("Certains champs client sont obligatoires !");
      setErrors(prev => ({ ...prev, ...clientErrors }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Vérification lignes
    if (!invoiceData.lines || invoiceData.lines.length === 0) {
      setErrorMessage("Vous devez ajouter au moins une ligne de facture !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const lineErrors = invoiceData.lines.filter(
      line => !line.description || !line.quantity || !line.unit_price
    );
    if (lineErrors.length > 0) {
      setErrorMessage("Chaque ligne doit avoir une description, une quantité et un prix unitaire !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Vérification justificatif principal
    const mainCount = invoiceData.attachments.filter(a => a.attachment_type === 'main').length;
    if (mainCount !== 1) {
      setErrorMessage("La facture doit avoir un justificatif principal");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const formData = new FormData();
      const { header } = invoiceData;

      // Invoice data JSON
      formData.append("invoice", JSON.stringify({
        invoice_number: header.invoice_number,
        issue_date: header.issue_date,
        fiscal_year: header.fiscal_year,
        seller_id: header.seller_id,
        client_id: header.client_id,
        client_type: header.client_type,
        client_first_name: header.client_first_name,
        client_last_name: header.client_last_name,
        client_legal_name: header.client_legal_name || "Entreprise inconnue", 
        client_siret: header.client_siret,
        client_vat_number: header.client_vat_number,
        client_address: header.client_address,
        client_city: header.client_city,
        client_postal_code: header.client_postal_code,
        client_country_code: header.client_country_code,
        client_email: header.client_email,
        client_phone: header.client_phone,
        subtotal,
        total_taxes: totalTaxes,
        total
      }));

      formData.append("lines", JSON.stringify(linesWithTotals));
      formData.append("taxes", JSON.stringify(invoiceData.taxes.length ? invoiceData.taxes : taxesSummary));

      // Ajout des fichiers à FormData
      invoiceData.attachments.forEach((att) => {
        if (att.raw_file instanceof File) {
          formData.append("attachments", att.raw_file);
        }
      });

      // **Ajout des métadonnées une seule fois**
      formData.append("attachments_meta", JSON.stringify(
        invoiceData.attachments.map(att => ({ attachment_type: att.attachment_type }))
      ));

      // Log final pour debug
      console.log("Final FormData keys and files:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Envoi
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await createInvoice(formData);
        setSuccessMessage("Facture créée avec succès ! 🎉");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => { setSuccessMessage(""); navigate("/invoices"); }, 2000);
      }

    } catch (err) {
      const msg = err.message || "Erreur lors de la création de la facture";
      setErrorMessage(msg);
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
        errors={errors}                   // Passer les erreurs
        touchedFields={headerTouched}     // Passer touched
        setTouchedFields={setHeaderTouched}
      />

      <InvoiceLines data={linesWithTotals} onChange={val => handleChange("lines", val)} />
      <TaxBases data={invoiceData.taxes.length ? invoiceData.taxes : taxesSummary} onChange={val => handleChange("taxes", val)} />
      <SupportingDocs
        data={invoiceData.attachments}
        onChange={(val) => {
          console.log("Updating attachments:", val);
          handleChange("attachments", val);
        }}
        allowPrincipal
      />


      <div className="card p-3 mb-3">
        <h5>Récapitulatif</h5>
        <p>Montant HT : {subtotal.toFixed(2)} €</p>
        <p>Total TVA : {totalTaxes.toFixed(2)} €</p>
        <p>Total TTC : {total.toFixed(2)} €</p>
      </div>

      <div className="d-flex justify-content-end mt-3 mb-3 me-3">
        <button type="submit" className="btn btn-primary" disabled={disabled}>Créer la facture</button>
      </div>
    </form>
  );
}
