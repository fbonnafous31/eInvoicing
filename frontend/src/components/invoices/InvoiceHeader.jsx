import React, { useEffect, useState } from "react";
import axios from "axios";
import { paymentTermsOptions } from '../../constants/paymentTerms';

export default function InvoiceHeader({ data, onChange }) {
  const [sellers, setSellers] = useState([]);
  const [clients, setClients] = useState([]);

  // Récupérer les vendeurs et clients pour les dropdowns
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

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="card p-3 mb-3">
      <h5>Facture</h5>

      <div className="mb-2">
        <label>Référence facture</label>
        <input
          type="text"
          value={data.invoice_number || ""}
          maxLength={20}
          onChange={e => handleChange("invoice_number", e.target.value)}
          className="form-control"
        />
      </div>

      <div className="mb-2">
        <label>Date émission</label>
        <input
          type="date"
          value={data.issue_date || ""}
          onChange={e => handleChange("issue_date", e.target.value)}
          className="form-control"
        />
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
        <label>Vendeur</label>
        <select
          value={data.seller_id || ""}
          onChange={e => handleChange("seller_id", e.target.value)}
          className="form-control"
          required
        >
          <option value="">-- Sélectionner un vendeur --</option>
          {sellers.map(s => (
            <option key={s.id} value={s.id}>
              {s.legal_name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label>Client</label>
        <select
          value={data.client_id || ""}
          onChange={e => handleChange("client_id", e.target.value)}
          className="form-control"
          required
        >
          <option value="">-- Sélectionner un client --</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.legal_name}
            </option>
          ))}
        </select>
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
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
