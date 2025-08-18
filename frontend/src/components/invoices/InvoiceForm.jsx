import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceLines from "./InvoiceLines";
import TaxBases from "./TaxBases";
import SupportingDocs from "./SupportingDocs";
import axios from "axios";

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState({
    header: {},
    lines: [],
    taxes: [],
    attachments: [] // { raw_file: File, attachment_type: 'main'|'additional' }
  });
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleChange = (section, value) => setInvoiceData(prev => ({ ...prev, [section]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérification date et exercice fiscal
    const issueDate = invoiceData.header.issue_date;
    const fiscalYear = invoiceData.header.fiscal_year;
    if (!issueDate) { alert("Veuillez saisir la date d'émission."); return; }
    const issueYear = new Date(issueDate).getFullYear();
    if (!fiscalYear || fiscalYear < issueYear - 1 || fiscalYear > issueYear + 1) {
      alert(`L'exercice fiscal doit être compris entre ${issueYear - 1} et ${issueYear + 1}`);
      return;
    }

    // Vérification justificatif principal
    const mainCount = invoiceData.attachments.filter(a => a.attachment_type === 'main').length;
    if (mainCount !== 1) {
      alert("La facture doit avoir un justificatif principal.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append(
        "invoice",
        JSON.stringify({ ...invoiceData.header, subtotal, total_taxes: totalTaxes, total })
      );
      formData.append("lines", JSON.stringify(linesWithTotals));
      formData.append("taxes", JSON.stringify(invoiceData.taxes.length ? invoiceData.taxes : taxesSummary));

      invoiceData.attachments.forEach(att => {
        formData.append("attachments", att.raw_file);
      });
      formData.append(
        "attachments_meta",
        JSON.stringify(invoiceData.attachments.map(att => ({ attachment_type: att.attachment_type })))
      );

      await axios.post("/api/invoices", formData, { headers: { "Content-Type": "multipart/form-data" } });

      setSuccessMessage("Facture créée avec succès ! 🎉");
      setTimeout(() => { setSuccessMessage(""); navigate("/invoices"); }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Erreur lors de la création de la facture";
      alert(message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <InvoiceHeader data={invoiceData.header} onChange={val => handleChange("header", val)} />
      <InvoiceLines data={linesWithTotals} onChange={val => handleChange("lines", val)} />
      <TaxBases data={invoiceData.taxes.length ? invoiceData.taxes : taxesSummary} onChange={val => handleChange("taxes", val)} />
      <SupportingDocs data={invoiceData.attachments} onChange={val => handleChange("attachments", val)} allowPrincipal />

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
