// frontend/src/pages/sellers/SellerForm.jsx
import React from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

import LegalFields from './fields/LegalFields';
import ContactFields from './fields/ContactFields';
import AddressFields from './fields/AddressFields';
import FinanceFields from './fields/FinanceFields';
import useSellerForm from '../../modules/sellers/useSellerForm';
import { validateSeller } from '../../utils/validators/seller';
import SaveButton from '@/components/ui/buttons/SaveButton';

countries.registerLocale(enLocale);
const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

export default function SellerForm({ onSubmit, disabled = false, initialData = {} }) {
  const {
    formData,
    errors,
    touched,
    openSections,
    toggleSection,
    handleChange,
    handleBlur,
    setErrors,
    setTouched,
    siretExists
  } = useSellerForm(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Marquer tous les champs comme touchés pour déclencher les erreurs
    const allFieldsTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allFieldsTouched);

    const cleanedSiret = (formData.legal_identifier || '').toString().replace(/\D/g, '');
    const newErrors = validateSeller({ ...formData, legal_identifier: cleanedSiret });

    if (siretExists) newErrors.legal_identifier = 'Ce SIRET est déjà utilisé';
    setErrors(newErrors);

    // Ouvrir les sections contenant des erreurs
    Object.keys(openSections).forEach(section => {
      if (sectionHasError(section, newErrors) && !openSections[section]) {
        toggleSection(section);
      }
    });

    // Submit si pas d’erreurs
    if (Object.keys(newErrors).length === 0 && onSubmit) {
      const payload = {
        ...formData,
        legal_identifier: formData.country_code === 'FR' ? cleanedSiret : formData.vat_number?.trim() || null
      };
      onSubmit(payload);
    }
  };

  const sections = [
    { key: 'legal', label: 'Informations légales', component: LegalFields },
    { key: 'contact', label: 'Contact', component: ContactFields },
    { key: 'address', label: 'Adresse', component: AddressFields },
    { key: 'finances', label: 'Finances', component: FinanceFields }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      {sections.map(({ key, label, component }) => {
        const hasError = sectionHasError(key, errors);

        return (
          <div className="mb-3" key={key}>
            <button
              type="button"
              className="btn btn-link p-0 mb-2"
              onClick={() => toggleSection(key)}
            >
              {label} {openSections[key] ? '▲' : '▼'} {hasError && '⚠️'}
            </button>

            {openSections[key] &&
              React.createElement(component, {
                formData,
                errors,
                touched,
                handleChange,
                handleBlur,
                disabled,
                countryCodes: key === 'address' ? countryCodes : undefined
              })
            }
          </div>
        );
      })}

      {!disabled && (
        <div className="text-end mt-3">
          <SaveButton />
        </div>
      )}
    </form>
  );
}

// ---------------------
// Helper pour savoir si une section contient des erreurs
// ---------------------
function sectionHasError(section, errors) {
  const mapping = {
    legal: ['legal_name', 'legal_identifier', 'company_type'],
    contact: ['contact_email', 'phone_number'],
    address: ['address', 'city', 'postal_code', 'country_code'],
    finances: ['vat_number', 'registration_info', 'share_capital', 'iban', 'bic']
  };

  return Object.keys(errors).some(key => mapping[section]?.includes(key));
}
