// frontend/src/pages/clients/ClientForm.jsx
import React from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

import LegalFields from './fields/LegalFields';
import ContactFields from './fields/ContactFields';
import AddressFields from './fields/AddressFields';
import FinanceFields from './fields/FinanceFields';
import useClientForm from '../../modules/clients/useClientForm';
import { validateClient } from '../../utils/validators/client';

countries.registerLocale(enLocale);
const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

export default function ClientForm({ onSubmit, disabled = false, initialData = {} }) {
  const {
    formData,
    errors,
    siretExists,
    openSections,
    toggleSection,
    handleChange,
    setErrors
  } = useClientForm(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Nettoyage SIRET pour validation
    const cleanedSiret = (formData.siret || '').toString().replace(/\D/g, '');

    // Validation centralisée
    const newErrors = validateClient({ ...formData, siret: cleanedSiret });

    // Vérification SIRET déjà existant (base de données)
    if (siretExists) newErrors.siret = 'Ce SIRET est déjà utilisé';

    setErrors(newErrors);

    // Ouvrir les sections avec erreurs
    Object.keys(openSections).forEach(section => {
      const hasError = sectionHasError(section, newErrors);
      if (hasError !== openSections[section]) toggleSection(section);
    });

    // Envoi si pas d'erreurs
    if (Object.keys(newErrors).length === 0) {
      const payload = {
        ...formData,
        is_company: !!formData.is_company,
        legal_name: formData.is_company
          ? formData.legal_name?.trim()
          : `${formData.firstname?.trim() || ''} ${formData.lastname?.trim() || ''}`.trim(),
        siret: formData.is_company && formData.country_code === 'FR' ? cleanedSiret : null,
        legal_identifier: formData.is_company
          ? formData.country_code === 'FR'
            ? cleanedSiret
            : formData.vat_number?.trim() || null
          : null,
      };
      if (onSubmit) onSubmit(payload);
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
        const Component = component;

        return (
          <div className="mb-3" key={key}>
            <button type="button" className="btn btn-link p-0 mb-2" onClick={() => toggleSection(key)}>
              {label} {openSections[key] ? '▲' : '▼'} {hasError && '⚠️'}
            </button>
            {openSections[key] && (
              <Component
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                disabled={disabled}
                countryCodes={key === 'address' ? countryCodes : undefined}
              />
            )}
          </div>
        );
      })}

      {!disabled && (
        <div className="text-end mt-3">
          <button type="submit" className="btn btn-primary">Enregistrer</button>
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
    legal: ['legal_name', 'siret', 'legal_identifier', 'firstname', 'lastname'],
    contact: ['email', 'phone_number'],
    address: ['address', 'city', 'postal_code', 'country_code'],
    finances: ['vat_number']
  };

  return Object.keys(errors).some(key => mapping[section]?.includes(key));
}
