// frontend/src/components/invoices/InvoiceHeader.jsx
import React, { useEffect, useState, useCallback } from "react";
import { paymentTermsOptions } from "../../constants/paymentTerms";
import { paymentMethodsOptions } from '../../constants/paymentMethods';
import { FormSection, InputField, SelectField, DatePickerField } from '@/components/form';
import { useSellerService } from "../../services/sellers";
import { validateInvoiceField } from "../../utils/validators/invoice";
import { validateIssueDate } from "../../utils/validators/issueDate";
import { invoiceTypeOptions } from "../../constants/invoiceTypes";
import { useInvoiceService } from "../../services/invoices";
import CreatableSelect from "react-select/creatable";

export default function InvoiceHeader({ data, onChange, submitted, errors = {}, disabled }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [openSections, setOpenSections] = useState({ info: true, contract: true });

  const { fetchMySeller } = useSellerService();

  const { fetchDepositInvoices } = useInvoiceService();
  const [depositInvoices, setDepositInvoices] = useState([]);
  
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

        {data.invoice_type === "final" && (
          <div className="form-group mb-3"> 
            <label htmlFor="original_invoice_number">Référence facture d’acompte</label>
            <CreatableSelect
              id="original_invoice_number"
              isClearable
              value={
                data.original_invoice_number
                  ? { 
                      value: data.original_invoice_number, 
                      label: data.original_invoice_number.trim() 
                    }
                  : null
              }
              onChange={(selectedOption) => {
                // 1. On prépare la mise à jour de l'objet header
                const newData = { ...data };

                if (!selectedOption) {
                  // Si l'utilisateur efface la sélection
                  newData.original_invoice_number = "";
                  newData.original_invoice_id = null;
                } else if (selectedOption.__isNew__) {
                  // Si l'utilisateur saisit un numéro manuellement
                  newData.original_invoice_number = selectedOption.value;
                  newData.original_invoice_id = null;
                } else {
                  // SÉLECTION D'UNE FACTURE EXISTANTE
                  // On cherche l'objet facture complet dans la liste pour extraire l'ID (UUID)
                  const selectedInv = depositInvoices.find(
                    inv => inv.invoice_number === selectedOption.value
                  );
                  
                  newData.original_invoice_number = selectedOption.value;
                  // On récupère l'UUID (vérifie que ton API renvoie bien .id)
                  newData.original_invoice_id = selectedInv ? selectedInv.id : null;
                }

                // 2. On transmet l'objet complet (avec les 2 clés) au parent
                onChange(newData);
                
                // 3. On déclenche la validation manuellement pour ce champ
                validateField("original_invoice_number", newData.original_invoice_number);
              }}
              options={depositInvoices.map(inv => ({
                value: inv.invoice_number,
                label: `${inv.invoice_number.trim()} - ${inv.client_name || 'Client'} - ${inv.total} €`
              }))}
              placeholder="Sélectionnez ou saisissez une facture d’acompte..."
              isDisabled={disabled}
              formatCreateLabel={inputValue => `Saisir manuellement : "${inputValue}"`}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isDisabled ? '#e8ebeefa' : '#fff', 
                  borderColor: '#ced4da',
                  boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
                  '&:hover': {
                    borderColor: '#adb5bd', 
                  },
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: '#212529', 
                }),
                input: (provided) => ({
                  ...provided,
                  color: '#212529', 
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: '#6c757d', 
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: '#fff', 
                  zIndex: 9999 // Pour être sûr que le menu s'affiche au-dessus des autres champs
                }),
              }}            
            />
            {/* Affichage de l'erreur si elle existe */}
            {(touchedFields.original_invoice_number || submitted) && errors.original_invoice_number && (
              <div className="text-danger small mt-1">{errors.original_invoice_number}</div>
            )}
          </div>
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
