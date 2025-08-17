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
    attachments: [] // tableau de File objects
  });
  const [successMessage, setSuccessMessage] = useState("");

  // Calculs dérivés pour récapitulatif
  const { subtotal, totalTaxes, total, linesWithTotals } = useMemo(() => {
    let st = 0,
      tt = 0;
    const newLines = invoiceData.lines.map((line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unit_price = parseFloat(line.unit_price) || 0;
      const discount = parseFloat(line.discount) || 0;
      const vat_rate = parseFloat(line.vat_rate) || 0;

      const line_net = quantity * unit_price - discount;
      const line_tax = (line_net * vat_rate) / 100;
      const line_total = line_net + line_tax;

      st += line_net;
      tt += line_tax;

      return { ...line, line_net, line_tax, line_total };
    });

    return { subtotal: st, totalTaxes: tt, total: st + tt, linesWithTotals: newLines };
  }, [invoiceData.lines]);

  const handleChange = (section, value) => {
    setInvoiceData((prev) => ({ ...prev, [section]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      // Ajouter les données de la facture
      formData.append(
        "invoice",
        JSON.stringify({ ...invoiceData.header, subtotal, total_taxes: totalTaxes, total })
      );
      formData.append("lines", JSON.stringify(linesWithTotals));
      formData.append("taxes", JSON.stringify(invoiceData.taxes));

      // Ajouter les fichiers uploadés
      invoiceData.attachments.forEach((file) => {
        formData.append("attachments", file); // doit correspondre au name du multer.array
      });

      await axios.post("/api/invoices", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage("Facture créée avec succès ! 🎉");
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/invoices");
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la facture");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      <InvoiceHeader
        data={invoiceData.header}
        onChange={(val) => handleChange("header", val)}
      />
      <InvoiceLines
        data={linesWithTotals}
        onChange={(val) => handleChange("lines", val)}
      />
      <TaxBases
        data={invoiceData.taxes}
        onChange={(val) => handleChange("taxes", val)}
      />
      <SupportingDocs
        data={invoiceData.attachments}
        onChange={(val) => handleChange("attachments", val)}
      />

      <div className="card p-3 mb-3">
        <h5>Récapitulatif</h5>
        <p>Montant HT : {subtotal.toFixed(2)} €</p>
        <p>Total TVA : {totalTaxes.toFixed(2)} €</p>
        <p>Total TTC : {total.toFixed(2)} €</p>
      </div>

      <div className="d-flex justify-content-end mt-3 mb-3 me-3">
        <button type="submit" className="btn btn-primary">
          Créer la facture
        </button>
      </div>
    </form>
  );
}
