import React, { useEffect, useState } from "react";
import axios from "axios";
import { paymentTermsOptions } from '../../constants/paymentTerms';

export default function InvoiceHeader({ data, onChange, submitted }) {
  const [sellers, setSellers] = useState([]);
  const [clients, setClients] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sellersRes, clientsRes] = await Promise.all([
          axios.get("http://localhost:3000/api/sellers"),
          axios.get("http://localhost:3000/api/clients")
        ]);
        setSellers(sellersRes.data);
        setClients(clientsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const validateField = (field, value) => {
    let newErrors = { ...fieldErrors };
    const issueYear = data.issue_date ? new Date(data.issue_date).getFullYear() : new Date().getFullYear();

    switch (field) {
      case "invoice_number":
        if (!value) newErrors.invoice_number = "Ce champ est obligatoire";
        else delete newErrors.invoice_number;
        break;
      case "issue_date":
        if (!value) newErrors.issue_date = "Ce champ est obligatoire";
        else delete newErrors.issue_date;
        break;
      case "fiscal_year":
        if (value < issueYear - 1 || value > issueYear + 1) {
          newErrors.fiscal_year = `L’exercice fiscal doit être compris entre ${issueYear - 1} et ${issueYear + 1}`;
        } else delete newErrors.fiscal_year;
        break;
      case "seller_id":
        if (!value) newErrors.seller_id = "Ce champ est obligatoire";
        else delete newErrors.seller_id;
        break;
      case "client_id":
        if (!value) newErrors.client_id = "Ce champ est obligatoire";
        else delete newErrors.client_id;
        break;
      default:
        break;
    }

    setFieldErrors(newErrors);
  };

  const handleChange = (field, value) => {
    let newData = { ...data, [field]: value };

    // Ajuster fiscal_year par défaut si issue_date change et fiscal_year non saisi
    if (field === 'issue_date' && (!data.fiscal_year || data.fiscal_year === '')) {
      const issueYear = new Date(value).getFullYear();
      newData.fiscal_year = issueYear;
    }

    onChange(newData);
    validateField(field, value);
  };

  const handleBlur = (field, value) => {
    validateField(field, value);
  };

  const issueYear = data.issue_date ? new Date(data.issue_date).getFullYear() : new Date().getFullYear();
  const fiscalYearValue = data.fiscal_year || issueYear;

  return (
    <div className="card p-3 mb-3">
      <h5>Facture</h5>
      <small className="text-muted mb-2 d-block">* Champs obligatoires</small>

      <div className="mb-2">
        <label>Référence facture <span className="text-danger">*</span></label>
        <input
          type="text"
          value={data.invoice_number || ""}
          maxLength={20}
          onChange={e => handleChange("invoice_number", e.target.value)}
          onBlur={e => handleBlur("invoice_number", e.target.value)}
          className="form-control"
        />
        {(submitted || fieldErrors.invoice_number) && fieldErrors.invoice_number && (
          <small className="text-danger">{fieldErrors.invoice_number}</small>
        )}
      </div>

      <div className="mb-2">
        <label>Date émission <span className="text-danger">*</span></label>
        <input
          type="date"
          value={data.issue_date || ""}
          onChange={e => handleChange("issue_date", e.target.value)}
          onBlur={e => handleBlur("issue_date", e.target.value)}
          className="form-control"
        />
        {(submitted || fieldErrors.issue_date) && fieldErrors.issue_date && (
          <small className="text-danger">{fieldErrors.issue_date}</small>
        )}
      </div>

      <div className="mb-2">
        <label>Exercice fiscal <span className="text-danger">*</span></label>
        <input
          type="number"
          value={fiscalYearValue}
          min={issueYear - 1}
          max={issueYear + 1}
          onChange={e => handleChange("fiscal_year", +e.target.value)}
          onBlur={e => handleBlur("fiscal_year", +e.target.value)}
          className="form-control"
        />
        {(submitted || fieldErrors.fiscal_year) && fieldErrors.fiscal_year && (
          <div className="text-danger">{fieldErrors.fiscal_year}</div>
        )}
      </div>

      <div className="mb-3">
        <label>Date de livraison</label>
        <input
          type="date"
          className="form-control"
          value={data.supply_date || ''}
          onChange={e => handleChange("supply_date", e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label>Vendeur <span className="text-danger">*</span></label>
        <select
          value={data.seller_id || ""}
          onChange={e => handleChange("seller_id", e.target.value)}
          onBlur={e => handleBlur("seller_id", e.target.value)}
          className="form-control"
        >
          <option value="">-- Sélectionner un vendeur --</option>
          {sellers.map(s => (
            <option key={s.id} value={s.id}>{s.legal_name}</option>
          ))}
        </select>
        {(submitted || fieldErrors.seller_id) && fieldErrors.seller_id && (
          <small className="text-danger">{fieldErrors.seller_id}</small>
        )}
      </div>

      <div className="mb-2">
        <label>Client <span className="text-danger">*</span></label>
        <select
          value={data.client_id || ""}
          onChange={e => handleChange("client_id", e.target.value)}
          onBlur={e => handleBlur("client_id", e.target.value)}
          className="form-control"
        >
          <option value="">-- Sélectionner un client --</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.legal_name}</option>
          ))}
        </select>
        {(submitted || fieldErrors.client_id) && fieldErrors.client_id && (
          <small className="text-danger">{fieldErrors.client_id}</small>
        )}
      </div>

      <div className="mb-3">
        <label>Numéro de contrat</label>
        <input
          type="text"
          className="form-control"
          maxLength={20}
          value={data.contract_number || ''}
          onChange={e => handleChange("contract_number", e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Numéro de commande</label>
        <input
          type="text"
          className="form-control"
          maxLength={20}
          value={data.purchase_order_number || ''}
          onChange={e => handleChange("purchase_order_number", e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label>Conditions de paiement</label>
        <select
          value={data.payment_terms || '30_df'}
          onChange={e => handleChange("payment_terms", e.target.value)}
          className="form-control"
        >
          {paymentTermsOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
