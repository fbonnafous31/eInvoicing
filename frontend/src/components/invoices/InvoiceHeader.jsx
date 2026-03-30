// frontend/src/components/invoices/InvoiceHeader.jsx
import React, { useEffect, useState, useCallback } from "react";
import { paymentTermsOptions } from "../../constants/paymentTerms";
import { paymentMethodsOptions } from '../../constants/paymentMethods';
import { FormSection, InputField, SelectField, DatePickerField, CreatableSelect } from '@/components/form';
import { useSellerService } from "../../services/sellers";
import { validateInvoiceField } from "../../utils/validators/invoice";
import { validateIssueDate } from "../../utils/validators/issueDate";
import { invoiceTypeOptions } from "../../constants/invoiceTypes";
import { useInvoiceService } from "../../services/invoices";

export default function InvoiceHeader({ data, onChange, submitted, errors = {}, disabled }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [openSections, setOpenSections] = useState({ info: true, contract: true });

  const { fetchMySeller } = useSellerService();

  const { fetchDepositInvoices, fetchInvoicesBySeller } = useInvoiceService();
  const [depositInvoices, setDepositInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [referenceStatus, setReferenceStatus] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const invoices = await fetchInvoicesBySeller();
        setAllInvoices(invoices);
      } catch (err) {
        console.error("Erreur récupération factures:", err);
        setAllInvoices([]);
      }
    };

    fetchAll();
  }, [fetchInvoicesBySeller]);

  // Récupérer les factures d’acompte pour le dropdown
  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        // Si data.client_id est défini, on filtre par client
        const deposits = await fetchDepositInvoices(data.client_id);
        setDepositInvoices(deposits);
      } catch (err) {
        console.error("Erreur récupération factures d’acompte :", err);
        setDepositInvoices([]);
      }
    };
    fetchDeposits();
  }, [data.client_id, fetchDepositInvoices]);

  // Racordement automatique de l’ID de la facture d’origine à partir de la référence saisie
  useEffect(() => {
    const refNumber = data.original_invoice_number?.trim();

    // 1️⃣ Champ vide → rien à signaler
    if (!refNumber) {
      setReferenceStatus(null);
      return;
    }

    // 2️⃣ ID déjà présent → tout est ok
    if (data.original_invoice_id) {
      setReferenceStatus('found');
      return;
    }

    // 3️⃣ Chercher la facture correspondante
    const sourceInvoices = data.invoice_type === 'final' ? depositInvoices : allInvoices;
    const match = sourceInvoices.find(inv => inv.invoice_number.trim() === refNumber);

    if (match) {
      console.log("🔗 Raccordement auto de l'ID trouvé :", match.id);
      setReferenceStatus('found');
      onChange({
        ...data,
        original_invoice_id: match.id,
        deposit_amount: match.total,
      });
    } else {
      console.log("⚠️ Aucun ID trouvé pour la référence :", refNumber);
      setReferenceStatus('not_found');
    }
  }, [depositInvoices, allInvoices, data.original_invoice_number, data.original_invoice_id, data.invoice_type, onChange]);

  // --- Validation ---
  const validateField = useCallback((field, value) => {
    // Ne pas valider à l'ouverture si le champ n'a pas été touché et pas de soumission
    if (!touchedFields[field] && !submitted) return;

    let error = null;
    const fullData = { ...data, [field]: value };
    if (field === "issue_date") {
      error = validateIssueDate(value);
    } else {
      error = validateInvoiceField(field, fullData[field], fullData);
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  }, [data, touchedFields, submitted]);

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
          handleChange("seller_id", seller.id); 
        }
      } catch (err) {
        console.error("Erreur fetch my seller:", err);
      }
    };
    fetchData();
  }, [fetchMySeller, handleChange, data.seller_id]);

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
        <SelectField
          id="invoice_type"
          label="Type de facture"
          value={data.invoice_type || ""}
          onChange={val => handleChange("invoice_type", val)}
          onBlur={() => handleBlur("invoice_type")}
          options={invoiceTypeOptions}
          required
          disabled={disabled}
        />

        <InputField
          id="invoice_number"
          label="Référence facture"
          value={data.invoice_number || ""}
          onChange={val => handleChange("invoice_number", val)}
          onBlur={() => handleBlur("invoice_number")}
          error={getError("invoice_number")}
          required
          disabled={disabled}
          maxLength={20}
        />

        {(data.invoice_type === "final" || data.invoice_type === "credit_note") && (
          <CreatableSelect
            id="original_invoice_number"
            label={
              data.invoice_type === "final"
                ? "Référence facture d’acompte"
                : "Référence facture d’origine"
            }
            value={
              data.original_invoice_id
                ? { 
                    value: data.original_invoice_id,
                    label: data.original_invoice_number.trim(),
                    invoice_number: data.original_invoice_number
                  }
                : data.original_invoice_number
                  ? {
                      value: data.original_invoice_number, 
                      label: data.original_invoice_number.trim(),
                      __isNew__: true 
                    }
                  : null
            }
            onChange={(selectedOption) => {
              const newData = { ...data };

              if (!selectedOption) {
                newData.original_invoice_number = "";
                newData.original_invoice_id = null;
              } else if (selectedOption.__isNew__) {
                newData.original_invoice_number = selectedOption.value;
                newData.original_invoice_id = null;
              } else {
                newData.original_invoice_number = selectedOption.invoice_number;
                newData.original_invoice_id = selectedOption.value;
              }

              onChange(newData);
              validateField("original_invoice_number", newData.original_invoice_number);
            }}
            onBlur={handleBlur}
            options={
              data.invoice_type === "final"
                ? depositInvoices.map(inv => ({
                    value: inv.id,
                    label: `${inv.invoice_number.trim()} - ${inv.client_name || 'Client'} - ${inv.total} €`,
                    invoice_number: inv.invoice_number
                  }))
                : []
            }
            placeholder={
              data.invoice_type === "final"
                ? "Sélectionnez ou saisissez une facture d’acompte..."
                : "Saisissez la référence de la facture d’origine..."
            }
            formatCreateLabel={inputValue => `Saisir manuellement : "${inputValue}"`}
            disabled={disabled}
            error={getError("original_invoice_number")}
            feedbackText={
              referenceStatus === "found"
                ? "✅ Facture correspondante trouvée"
                : referenceStatus === "not_found"
                ? "⚠️ Aucune facture correspondante trouvée"
                : ""
            }
            feedbackClass={
              referenceStatus === "found"
                ? "text-success"
                : referenceStatus === "not_found"
                ? "text-warning"
                : ""
            }
          />
        )}

        {data.invoice_type !== "quote" && (
          <InputField
            id="original_quote_number"
            label="Référence devis d’origine"
            value={data.original_quote_number || ""}
            onChange={val => handleChange("original_quote_number", val)}
            onBlur={() => handleBlur("original_quote_number")}
            error={getError("original_quote_number")}
            disabled={disabled}
            maxLength={20}
          />
        )}

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
