import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceLines from "./InvoiceLines";
import TaxBases from "./TaxBases";
import SupportingDocs from "./SupportingDocs";
import { createInvoice } from "../../services/invoices";
import { validateInvoiceField } from "../../utils/validators/invoice";

export default function InvoiceForm() {
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

  // Calculs des totaux
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

  // Modifications header / lignes / taxes / attachments
  const handleChange = (section, value) => {
    const newData = { ...invoiceData, [section]: value };
    setInvoiceData(newData);

    // Validation à la modification pour le header
    if (section === "header") {
      const newErrors = { ...errors };
      Object.keys(value).forEach(f => {
        const err = validateInvoiceField(f, value[f], value);
        if (err) newErrors[f] = err;
        else delete newErrors[f];
      });
      setErrors(newErrors);
    }
  };

  // Validation globale
  const validateAll = () => {
    const headerFields = ["invoice_number","issue_date","fiscal_year","seller_id","client_id"];
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
    setSubmitted(true); // <-- Indique au Header qu’on a soumis

    const headerErrors = validateAll();

    // Vérifier lignes de facture
    if (!invoiceData.lines || invoiceData.lines.length === 0) {
      alert("Vous devez ajouter au moins une ligne de facture !");
      return;
    }

    // Vérifier justificatif principal
    const mainCount = invoiceData.attachments.filter(a => a.attachment_type === 'main').length;
    if (mainCount !== 1) {
      alert("La facture doit avoir un justificatif principal");
      return;
    }

    // Bloquer création si erreurs header
    if (Object.keys(headerErrors).length > 0) {
      alert("Certains champs obligatoires sont manquants !");
      window.scrollTo({ top: 0, behavior: "smooth" }); 
      return;
    }

    // Soumission
    try {
      const formData = new FormData();
      formData.append(
        "invoice",
        JSON.stringify({ ...invoiceData.header, subtotal, total_taxes: totalTaxes, total })
      );
      formData.append("lines", JSON.stringify(linesWithTotals));
      formData.append("taxes", JSON.stringify(invoiceData.taxes.length ? invoiceData.taxes : taxesSummary));
      invoiceData.attachments.forEach(att => formData.append("attachments", att.raw_file));
      formData.append(
        "attachments_meta",
        JSON.stringify(invoiceData.attachments.map(att => ({ attachment_type: att.attachment_type })))
      );

      await createInvoice(formData);

      setSuccessMessage("Facture créée avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => { setSuccessMessage(""); navigate("/invoices"); }, 2000);
    } catch (err) {
      alert(err.message || "Erreur lors de la création de la facture");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <InvoiceHeader
        data={invoiceData.header}
        onChange={val => handleChange("header", val)}
        errors={errors}
        submitted={submitted} // <-- Permet d'afficher les erreurs après submit
      />

      <InvoiceLines data={linesWithTotals} onChange={val => handleChange("lines", val)} />
      <TaxBases data={invoiceData.taxes.length ? invoiceData.taxes : taxesSummary} onChange={val => handleChange("taxes", val)} />
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
        <button type="submit" className="btn btn-primary">Créer la facture</button>
      </div>
    </form>
  );
}
