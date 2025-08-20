import React, { useState, useEffect } from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { validatePerson } from '../../utils/validators';
import LegalFields from './fields/LegalFields';
import ContactFields from './fields/ContactFields';
import AddressFields from './fields/AddressFields';
import FinanceFields from './fields/FinanceFields';

countries.registerLocale(enLocale);
const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

export default function ClientForm({ onSubmit, disabled = false, initialData = {} }) {
  const [formData, setFormData] = useState({
    is_company: true,
    legal_name: '',
    firstname: '',
    lastname: '',
    siret: '',
    legal_identifier: '',
    address: '',
    city: '',
    postal_code: '',
    country_code: 'FR',
    vat_number: '',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: false,
    address: false,
    finances: false,
  });

  // ---------------------
  // Normalisation initialData
  // ---------------------
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => {
        const normalized = { ...prev, ...initialData };
        if (normalized.siret && !normalized.legal_identifier) {
          normalized.legal_identifier = normalized.siret;
        }
        console.log('[useEffect] Initial data normalized:', normalized);
        return normalized;
      });
    }
  }, [initialData]);

  // ---------------------
  // Synchronisation siret -> legal_identifier
  // ---------------------
  useEffect(() => {
    setFormData(prev => {
      // On compare prev.siret et prev.legal_identifier pour éviter le warning
      if (prev.siret !== prev.legal_identifier) {
        return { ...prev, legal_identifier: prev.siret };
      }
      return prev; // pas de changement -> pas de re-render
    });
  }, [formData.siret]);

  // ---------------------
  // Gestion des changements
  // ---------------------
  const handleChange = e => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? e.target.checked : value ?? '';

    const newFormData = { ...formData, [name]: val };
    setFormData(newFormData);

    const newErrors = validatePerson(newFormData);
    setErrors(newErrors);

    console.log(`[handleChange] Field changed: ${name} = ${val}`);
    console.log('[handleChange] Current formData:', newFormData);
    console.log('[handleChange] Current errors:', newErrors);
  };

  // ---------------------
  // Toggle sections
  // ---------------------
  const toggleSection = section => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ---------------------
  // Submit
  // ---------------------
  const handleSubmit = e => {
    e.preventDefault();

    const newErrors = validatePerson(formData);
    setErrors(newErrors);

    setOpenSections({
      legal: !!(formData.is_company ? newErrors.legal_name || newErrors.siret : newErrors.firstname || newErrors.lastname),
      contact: !!(newErrors.email || newErrors.phone),
      address: !!(newErrors.address || newErrors.city || newErrors.postal_code || newErrors.country_code),
      finances: !!newErrors.vat_number,
    });

    if (Object.keys(newErrors).length === 0) {
      const payload = {
        ...formData,
        is_company: !!formData.is_company,
        siret: formData.is_company && formData.country_code === 'FR' ? formData.siret?.trim() : null,
        legal_name: formData.is_company
          ? formData.legal_name?.trim()
          : `${formData.firstname?.trim() || ''} ${formData.lastname?.trim() || ''}`.trim(),
      };
      if (onSubmit) onSubmit(payload);
    }
  };

  // ---------------------
  // Render
  // ---------------------
  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">

      {/* Section Légale */}
      <div className="mb-3">
        <button type="button" className="btn btn-link p-0 mb-2" onClick={() => toggleSection('legal')}>
          Informations légales {openSections.legal ? '▲' : '▼'}
          {((formData.is_company && (errors.legal_name || errors.siret)) || (!formData.is_company && (errors.firstname || errors.lastname))) && ' ⚠️'}
        </button>
        {openSections.legal && (
          <LegalFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            disabled={disabled}
          />
        )}
      </div>

      {/* Section Contact */}
      <div className="mb-3">
        <button type="button" className="btn btn-link p-0 mb-2" onClick={() => toggleSection('contact')}>
          Contact {openSections.contact ? '▲' : '▼'}
          {(errors.email || errors.phone) && ' ⚠️'}
        </button>
        {openSections.contact && (
          <ContactFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            disabled={disabled}
          />
        )}
      </div>

      {/* Section Adresse */}
      <div className="mb-3">
        <button type="button" className="btn btn-link p-0 mb-2" onClick={() => toggleSection('address')}>
          Adresse {openSections.address ? '▲' : '▼'}
          {(errors.address || errors.city || errors.postal_code || errors.country_code) && ' ⚠️'}
        </button>
        {openSections.address && (
          <AddressFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            disabled={disabled}
            countryCodes={countryCodes}
          />
        )}
      </div>

      {/* Section Finances */}
      <div className="mb-3">
        <button type="button" className="btn btn-link p-0 mb-2" onClick={() => toggleSection('finances')}>
          Finances {openSections.finances ? '▲' : '▼'}
          {errors.vat_number && ' ⚠️'}
        </button>
        {openSections.finances && (
          <FinanceFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            disabled={disabled}
          />
        )}
      </div>

      {!disabled && (
        <div className="text-end mt-3">
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      )}
    </form>
  );
}
