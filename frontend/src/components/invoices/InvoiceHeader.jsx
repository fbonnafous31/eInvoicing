// frontend/src/components/invoices/InvoiceHeader.jsx
import React, { useEffect, useState } from "react";
import { paymentTermsOptions } from "../../constants/paymentTerms";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import FormSection from "../form/FormSection";
import { validateInvoiceField } from "../../utils/validators/invoice";
import { fetchSellers } from "../../services/sellers";

export default function InvoiceHeader({ data, onChange, submitted, errors = {} }) {
  const [sellers, setSellers] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [openSections, setOpenSections] = useState({ info: true, contract: true });

  // Récupération des vendeurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sellersData = await fetchSellers();
        setSellers(sellersData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const validateField = (field, value) => {
    const error = validateInvoiceField(field, value, data);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    if (field === "issue_date") {
      newData.fiscal_year = new Date(value).getFullYear();
    }
    onChange(newData);
    validateField(field, value);
    if (!touchedFields[field]) setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  };

  const getError = (field) => {
    const currentErrors = submitted ? errors : fieldErrors;
    return (touchedFields[field] || submitted) && currentErrors[field];
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionHasError = (fields) => {
    const currentErrors = submitted ? errors : fieldErrors;
    return fields.some(f => currentErrors[f]);
  };

  const issueYear = data.issue_date ? new Date(data.issue_date).getFullYear() : new Date().getFullYear();
  const fiscalYearValue = data.fiscal_year || issueYear;

  return (
    <div className="card p-3 mb-3">
      <h5>Facture</h5>
      <small className="text-muted mb-2 d-block">* Champs obligatoires</small>

      {/* Section Infos facture */}
      <FormSection
        title="Infos facture"
        sectionKey="info"
        openSections={openSections}
        toggleSection={toggleSection}
        hasError={sectionHasError(["invoice_number", "issue_date", "fiscal_year", "seller_id", "client_id"])}
      >
        <InputField
          id="invoice_number"
          label="Référence facture"
          value={data.invoice_number || ""}
          onChange={val => handleChange("invoice_number", val)}
          onBlur={() => handleBlur("invoice_number")}
          error={getError("invoice_number")}
          required
        />

        <InputField
          id="issue_date"
          type="date"
          label="Date émission"
          value={data.issue_date || ""}
          onChange={val => handleChange("issue_date", val)}
          onBlur={() => handleBlur("issue_date")}
          error={getError("issue_date")}
          required
        />

        <InputField
          id="fiscal_year"
          type="number"
          label="Exercice fiscal"
          value={fiscalYearValue}
          onChange={val => handleChange("fiscal_year", +val)}
          onBlur={() => handleBlur("fiscal_year")}
          error={getError("fiscal_year")}
          required
          min={issueYear - 1}
          max={issueYear + 1}
        />

        <SelectField
          label="Vendeur"
          value={data.seller_id}
          onChange={val => handleChange("seller_id", val)}
          onBlur={() => handleBlur("seller_id")}
          options={sellers.map(s => ({ value: s.id, label: s.legal_name || "Vendeur" }))}
          error={getError("seller_id")}
          required
        />
      </FormSection>

      {/* Section Informations contractuelles */}
      <FormSection
        title="Informations contractuelles"
        sectionKey="contract"
        openSections={openSections}
        toggleSection={toggleSection}
        hasError={sectionHasError(["contract_number", "purchase_order_number"])}
      >
        <InputField
          id="contract_number"
          label="Numéro de marché"
          value={data.contract_number || ""}
          onChange={val => handleChange("contract_number", val)}
          onBlur={() => handleBlur("contract_number")}
          error={getError("contract_number")}
        />

        <InputField
          id="purchase_order_number"
          label="Numéro de commande"
          value={data.purchase_order_number || ""}
          onChange={val => handleChange("purchase_order_number", val)}
          onBlur={() => handleBlur("purchase_order_number")}
          error={getError("purchase_order_number")}
        />

        <SelectField
          label="Conditions de paiement"
          value={data.payment_terms || "30_df"}
          onChange={val => handleChange("payment_terms", val)}
          onBlur={() => handleBlur("payment_terms")}
          options={paymentTermsOptions}
        />
      </FormSection>

      {/* Date de livraison */}
      <InputField
        id="supply_date"
        type="date"
        label="Date de livraison"
        value={data.supply_date || ""}
        onChange={val => handleChange("supply_date", val)}
        onBlur={() => handleBlur("supply_date")}
        error={getError("supply_date")}
      />
    </div>
  );
}
