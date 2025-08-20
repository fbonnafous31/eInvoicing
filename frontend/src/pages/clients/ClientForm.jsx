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
  const [siretExists, setSiretExists] = useState(false);

  // ---------------------
  // Normalisation initialData
  // ---------------------
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // ---------------------
  // Vérification SIRET côté API
  // ---------------------
  const checkSiretAPI = async (siret) => {
    if (!siret || siret.length !== 14) {
      setSiretExists(false);
      setErrors(prev => ({ ...prev, siret: undefined }));
      return;
    }
    try {
      const res = await fetch(`/api/clients/check-siret/${siret}`);
      const data = await res.json();
      setSiretExists(data.exists);
      setErrors(prev => ({ ...prev, siret: data.exists ? 'Ce SIRET est déjà utilisé' : undefined }));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------
  // Gestion des changements
  // ---------------------
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let val = value ?? '';

    if (name === 'is_company') {
      val = value === true || value === 'true';
    } else if (type === 'checkbox') {
      val = e.target.checked;
    }

    setFormData(prev => {
      const updated = { ...prev, [name]: val };

      // Si c'est un particulier, vider SIRET et TVA
      if (name === 'is_company' && !val) {
        updated.siret = '';
        updated.legal_identifier = '';
        updated.vat_number = '';
      }

      // Synchronisation automatique du SIRET vers legal_identifier si entreprise FR
      if (name === 'siret') {
        const siretVal = (val || '').toString().replace(/\D/g, '');
        updated.siret = siretVal;
        if (updated.is_company && updated.country_code === 'FR') {
          updated.legal_identifier = siretVal;
        }
        checkSiretAPI(siretVal);
      }

      // Si on change le pays et qu'on n'est plus en FR, ne pas écraser legal_identifier
      if (name === 'country_code' && val !== 'FR') {
        updated.legal_identifier = prev.legal_identifier || '';
      }

      // Validation en temps réel
      const newErrors = validatePerson(updated);
      setErrors(newErrors);

      return updated;
    });
  };

  // ---------------------
  // Toggle sections
  // ---------------------
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ---------------------
  // Submit
  // ---------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedSiret = (formData.siret || '').toString().replace(/\D/g, '');
    const payloadData = { ...formData, siret: cleanedSiret };

    const newErrors = validatePerson(payloadData);
    if (siretExists) newErrors.siret = 'Ce SIRET est déjà utilisé';

    setErrors(newErrors);

    setOpenSections({
      legal: !!(
        (payloadData.is_company && (newErrors.legal_name || newErrors.siret || newErrors.legal_identifier)) ||
        (!payloadData.is_company && (newErrors.firstname || newErrors.lastname))
      ),
      contact: !!(newErrors.email || newErrors.phone),
      address: !!(newErrors.address || newErrors.city || newErrors.postal_code || newErrors.country_code),
      finances: !!newErrors.vat_number,
    });

    if (Object.keys(newErrors).length === 0 && onSubmit) {
      const payload = {
        ...payloadData,
        legal_name: payloadData.is_company
          ? payloadData.legal_name?.trim()
          : `${payloadData.firstname?.trim() || ''} ${payloadData.lastname?.trim() || ''}`.trim(),
        legal_identifier: payloadData.is_company
          ? payloadData.country_code === 'FR'
            ? cleanedSiret
            : payloadData.vat_number?.trim() || null
          : null,
        siret: payloadData.is_company && payloadData.country_code === 'FR' ? cleanedSiret : null,
      };
      onSubmit(payload);
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
          {((formData.is_company && (errors.legal_name || errors.siret || errors.legal_identifier)) ||
            (!formData.is_company && (errors.firstname || errors.lastname))) && ' ⚠️'}
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
