import React, { useState, useEffect } from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import companyTypes from '../../constants/companyTypes';
import { validateSeller } from '../../utils/validators';

// Sections
import LegalFields from './fields/LegalFields';
import ContactFields from './fields/ContactFields';
import AddressFields from './fields/AddressFields';
import FinanceFields from './fields/FinanceFields';

countries.registerLocale(enLocale);
const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

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
    contact_email: '',
    phone_number: '',
    company_type: 'MICRO',
  });
  const [errors, setErrors] = useState({});
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: false,
    address: false,
    finances: false,
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(validateSeller({ ...formData, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const newErrors = validateSeller(formData);
    setErrors(newErrors);

    // Ouverture automatique des sections contenant des erreurs
    setOpenSections({
      legal: !!(newErrors.legal_name || newErrors.legal_identifier || newErrors.company_type),
      contact: !!(newErrors.contact_email || newErrors.phone_number),
      address: !!(newErrors.address || newErrors.city || newErrors.postal_code || newErrors.country_code),
      finances: !!(newErrors.vat_number || newErrors.registration_info || newErrors.share_capital || newErrors.bank_details),
    });

    if (Object.keys(newErrors).length === 0 && onSubmit) {
      onSubmit(formData);
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
          {(errors.contact_email || errors.phone_number) && ' ⚠️'}
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
