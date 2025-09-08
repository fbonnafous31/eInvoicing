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
    touched,
    openSections,
    toggleSection,
    handleChange,
    handleBlur,
    setErrors,
    setTouched,
    checkSiretAPI
  } = useClientForm(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Marquer tous les champs comme touchés
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    // Nettoyage SIRET
    const cleanedSiret = (formData.siret || '').toString().replace(/\D/g, '');

    // Validation locale
    const newErrors = validateClient({ ...formData, siret: cleanedSiret });
    setErrors(newErrors);

    // Vérification SIRET côté API si FR
    if (formData.is_company && formData.country_code === 'FR' && cleanedSiret) {
      const result = await checkSiretAPI(cleanedSiret);
      if (!result.valid) {
        // Ouvre la section legal si erreur SIRET
        if (!openSections.legal) toggleSection('legal');
        return; // stop l'envoi
      }
    }

    // Ouvrir les sections avec erreurs locales
    Object.keys(openSections).forEach(section => {
      if (sectionHasError(section, newErrors, touched) && !openSections[section]) {
        toggleSection(section);
      }
    });

    // Envoi si pas d'erreurs
    if (Object.keys(newErrors).length === 0 && onSubmit) {
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
        const hasError = sectionHasError(key, errors, touched);
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
                touched={touched}
                handleChange={handleChange}
                handleBlur={handleBlur}
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
function sectionHasError(section, errors, touched) {
  const mapping = {
    legal: ['legal_name', 'siret', 'legal_identifier', 'firstname', 'lastname'],
    contact: ['email', 'phone'],
    address: ['address', 'city', 'postal_code', 'country_code'],
    finances: ['vat_number']
  };

  return Object.keys(errors).some(
    key => mapping[section]?.includes(key) && touched[key] && Boolean(errors[key])
  );
}
