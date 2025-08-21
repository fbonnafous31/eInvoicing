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

    const cleanedSiret = (formData.siret || '').toString().replace(/\D/g, '');
    const newErrors = {};

    // Validation entreprise FR
    if (formData.is_company) {
      if (formData.country_code === 'FR') {
        if (!cleanedSiret) newErrors.siret = 'Le SIRET est requis pour une entreprise française';
        else if (cleanedSiret.length !== 14) newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
      } else if (!formData.vat_number?.trim()) {
        newErrors.vat_number = 'Le numéro de TVA intracommunautaire est requis pour les entreprises non françaises';
      }
    }

    // Vérification SIRET déjà existant côté front
    if (siretExists) newErrors.siret = 'Ce SIRET est déjà utilisé';

    // Validation générale via validators.js
    Object.assign(newErrors, validateClient({ ...formData, siret: cleanedSiret }));

    setErrors(newErrors);

    // Ouvrir les sections avec erreurs
    Object.keys(openSections).forEach(section => {
      const hasError = Object.keys(newErrors).some(key => keyMatchesSection(key, section));
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

  // ---------------------
  // Définition dynamique des sections
  // ---------------------
  const sections = [
    {
      key: 'legal',
      label: 'Informations légales',
      component: LegalFields,
      show: true
    },
    {
      key: 'contact',
      label: 'Contact',
      component: ContactFields,
      show: true
    },
    {
      key: 'address',
      label: 'Adresse',
      component: AddressFields,
      show: true
    },
    {
      key: 'finances',
      label: 'Finances',
      component: FinanceFields,
      show: true
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      {sections.map(({ key, label, component, show }) => {
        if (!show) return null;

        const hasError = Object.keys(errors).some(field => keyMatchesSection(field, key));

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
// Helper pour savoir quel champ appartient à quelle section
// ---------------------
function keyMatchesSection(key, section) {
  const mapping = {
    legal: ['legal_name', 'siret', 'legal_identifier', 'firstname', 'lastname'],
    contact: ['email', 'phone'],
    address: ['address', 'city', 'postal_code', 'country_code'],
    finances: ['vat_number']
  };
  return mapping[section]?.includes(key);
}
