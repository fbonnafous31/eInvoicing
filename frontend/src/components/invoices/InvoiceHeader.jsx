// frontend/src/components/invoices/InvoiceHeader.jsx
import React, { useEffect, useState, useCallback } from "react";
import { paymentTermsOptions } from "../../constants/paymentTerms";
import { paymentMethodsOptions } from '../../constants/paymentMethods';
import { FormSection, InputField, SelectField, DatePickerField } from '@/components/form';
import { useSellerService } from "../../services/sellers";
import { validateInvoiceField } from "../../utils/validators/invoice";
import { validateIssueDate } from "../../utils/validators/issueDate";

export default function InvoiceHeader({ data, onChange, submitted, errors = {}, disabled }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [openSections, setOpenSections] = useState({ info: true, contract: true });

  const { fetchMySeller } = useSellerService();

  // --- Initial header avec valeurs par défaut ---
  const initialHeader = {
    invoice_number: data?.invoice_number || "",
    issue_date: data?.issue_date || new Date().toISOString().split("T")[0],
    fiscal_year: data?.fiscal_year || new Date().getFullYear(),
    seller_id: data?.seller_id || "",
    contract_number: data?.contract_number || "",
    purchase_order_number: data?.purchase_order_number || "",
    payment_method: data?.payment_method || "",
    payment_terms: data?.payment_terms || "",
  };

  // --- Validation ---
  const validateField = useCallback((field, value) => {
    // Ne pas valider à l'ouverture si le champ n'a pas été touché et pas de soumission
    if (!touchedFields[field] && !submitted) return;

    let error = null;
    const fullData = { ...data, ...initialHeader };
    if (field === "issue_date") {
      error = validateIssueDate(value);
    } else {
      error = validateInvoiceField(field, fullData[field], fullData);
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  }, [data, touchedFields, submitted, initialHeader]);

  // --- Gestion du changement ---
  const handleChange = useCallback((field, value) => {
    const newData = { ...data, [field]: value };
    if (field === "issue_date") {
      newData.fiscal_year = new Date(value).getFullYear();
    }
    onChange(newData);

    // Marquer comme touché uniquement si l'utilisateur modifie (pas pour auto-fill seller_id)
    if (field !== "seller_id" && !touchedFields[field]) {
      setTouchedFields(prev => ({ ...prev, [field]: true }));
    }

    validateField(field, value);
  }, [data, onChange, touchedFields, validateField]);

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

  // --- Auto-fill seller_id si vide ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const seller = await fetchMySeller();
        if (seller && !data.seller_id) {
          handleChange("seller_id", seller.id); // auto-fill, pas touché donc pas de warning
        }
      } catch (err) {
        console.error("Erreur fetch my seller:", err);
      }
    };
    fetchData();
  }, [fetchMySeller]);

  const issueYear = data.issue_date ? new Date(data.issue_date).getFullYear() : new Date().getFullYear();
  const fiscalYearValue = data.fiscal_year || issueYear;

  return (
    <div className="card p-3 mb-3">
      <h5>Facture</h5>
      <small className="text-muted mb-2 d-block">* Champs obligatoires</small>

      {/* Section Infos facture */}
      <FormSection
        title="Informations facture"
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
          disabled={disabled} 
        />

        <DatePickerField
          id="issue_date"
          label="Date émission"
          value={data.issue_date || ""}
          onChange={val => handleChange("issue_date", val)}
          onBlur={() => handleBlur("issue_date")}
          error={getError("issue_date")}
          required
          disabled={disabled} 
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
          disabled={disabled} 
          min={issueYear - 1}
          max={issueYear + 1}
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
          disabled={disabled} 
        />

        <InputField
          id="purchase_order_number"
          label="Numéro de commande"
          value={data.purchase_order_number || ""}
          onChange={val => handleChange("purchase_order_number", val)}
          onBlur={() => handleBlur("purchase_order_number")}
          error={getError("purchase_order_number")}
          disabled={disabled} 
        />

        <SelectField
          label="Moyen de paiement"
          value={data.payment_method || ''}
          onChange={val => handleChange("payment_method", val)}
          onBlur={() => handleBlur("payment_method")}
          options={paymentMethodsOptions}
          disabled={disabled}
        />

        <SelectField
          label="Conditions de paiement"
          value={data.payment_terms || ''}
          onChange={val => handleChange("payment_terms", val)}
          onBlur={() => handleBlur("payment_terms")}
          options={paymentTermsOptions}
          disabled={disabled} 
        />
      </FormSection>

      {/* Date de livraison */}
      <DatePickerField
        id="supply_date"
        label="Date de livraison"
        value={data.supply_date || ""}
        onChange={val => handleChange("supply_date", val)}
        onBlur={() => handleBlur("supply_date")}
        error={getError("supply_date")}
        disabled={disabled} 
      />
    </div>
  );
}
