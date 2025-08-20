import React, { useState, useEffect, useMemo } from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import companyTypes from '../../constants/companyTypes';
import { validatePerson } from '../../utils/validators';

// Sections
import LegalFields from './fields/LegalFields';
import ContactFields from './fields/ContactFields';
import AddressFields from './fields/AddressFields';
import FinanceFields from './fields/FinanceFields';

countries.registerLocale(enLocale);

export default function SellerForm({ onSubmit, disabled = false, initialData = {} }) {
  const [formData, setFormData] = useState({
    legal_name: '',
    legal_identifier: '',
    address: '',
    city: '',
    postal_code: '',
    country_code: 'FR',
    vat_number: '',
    registration_info: '',
    share_capital: '',
    bank_details: '',
    email: '',
    phone: '',
    company_type: 'MICRO',
    is_company: true,
  });

  const [errors, setErrors] = useState({});
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: false,
    address: false,
    finances: false,
  });

  // Liste des pays memoisée
  const countryCodes = useMemo(() => {
    return Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));
  }, []);

  // Normalisation des initialData pour éviter null/undefined
  const stableInitialData = useMemo(() => initialData, [initialData]);

  useEffect(() => {
    if (stableInitialData && Object.keys(stableInitialData).length > 0) {
      const normalizedData = {
        legal_name: '',
        legal_identifier: '',
        address: '',
        city: '',
        postal_code: '',
        country_code: 'FR',
        vat_number: '',
        registration_info: '',
        share_capital: '',
        bank_details: '',
        email: '',
        phone: '',
        company_type: 'MICRO',
        ...stableInitialData
      };

      Object.keys(normalizedData).forEach(key => {
        if (normalizedData[key] === null || normalizedData[key] === undefined) {
          normalizedData[key] = '';
        }
      });

      console.log('[useEffect] Initial data normalized:', normalizedData);
      setFormData(normalizedData);
    }
  }, [stableInitialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value ?? '' };
    setFormData(newFormData);

    const newErrors = validatePerson(newFormData);
    setErrors(newErrors);

    console.log(`[handleChange] Field changed: ${name} = ${value}`);
    console.log('[handleChange] Current formData:', newFormData);
    console.log('[handleChange] Current errors:', newErrors);
  };

  const handleSubmit = e => {
    e.preventDefault();
    console.log('[handleSubmit] Submit triggered', formData);

    const newErrors = validatePerson(formData);
    setErrors(newErrors);
    console.log('[handleSubmit] Validation errors:', newErrors);

    setOpenSections({
      legal: !!(newErrors.legal_name || newErrors.legal_identifier || newErrors.company_type),
      contact: !!(newErrors.email || newErrors.phone),
      address: !!(newErrors.address || newErrors.city || newErrors.postal_code || newErrors.country_code),
      finances: !!(newErrors.vat_number || newErrors.registration_info || newErrors.share_capital || newErrors.bank_details),
    });

    if (Object.keys(newErrors).length === 0) {
      console.log('[handleSubmit] No errors, calling onSubmit');
      if (onSubmit) onSubmit(formData);
    } else {
      console.log('[handleSubmit] Form has errors, cannot submit');
    }
  };

  const toggleSection = section => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">

      {/* Section Légale */}
      <div className="mb-3">
        <button type="button" className="btn btn-link p-0 mb-2" onClick={() => toggleSection('legal')}>
          Informations légales {openSections.legal ? '▲' : '▼'}
          {(errors.legal_name || errors.legal_identifier || errors.company_type) && ' ⚠️'}
        </button>
        {openSections.legal && (
          <LegalFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            disabled={disabled}
            companyTypes={companyTypes}
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
          Finances & Bancaires {openSections.finances ? '▲' : '▼'}
          {(errors.vat_number || errors.registration_info || errors.share_capital || errors.bank_details) && ' ⚠️'}
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
