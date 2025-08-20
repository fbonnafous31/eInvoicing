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
  const handleChange = e => {
    const { name, value, type } = e.target;
    let val = value ?? '';

    if (name === 'is_company') {
      val = value === 'true';
    } else if (type === 'checkbox') {
      val = e.target.checked;
    }

    setFormData(prev => {
      const updated = { ...prev, [name]: val };

      // Si c'est un particulier, on vide SIRET et TVA
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

      const newErrors = validatePerson(updated);
      setErrors(prev => ({ ...prev, ...newErrors }));

      return updated;
    });
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

    const cleanedSiret = (formData.siret || '').toString().replace(/\D/g, '');
    const newErrors = validatePerson({ ...formData, siret: cleanedSiret });

    // Validation entreprise FR
    if (formData.is_company) {
      if (formData.country_code === 'FR') {
        if (!cleanedSiret) {
          newErrors.siret = 'Le SIRET est requis pour une entreprise française';
        } else if (cleanedSiret.length !== 14) {
          newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
        }
      } else {
        // Validation entreprise non-FR
        if (!formData.vat_number?.trim()) {
          newErrors.vat_number = 'Le numéro de TVA intracommunautaire est requis pour les entreprises non françaises';
        }
      }
    }

    // Vérification SIRET déjà existant côté front
    if (siretExists) {
      newErrors.siret = 'Ce SIRET est déjà utilisé';
    }

    setErrors(newErrors);

    // Ouvrir uniquement les sections avec erreurs
    setOpenSections({
      legal: !!(
        (formData.is_company && (newErrors.legal_name || newErrors.siret || newErrors.legal_identifier)) || 
        (!formData.is_company && (newErrors.firstname || newErrors.lastname))
      ),
      contact: !!(newErrors.email || newErrors.phone),
      address: !!(newErrors.address || newErrors.city || newErrors.postal_code || newErrors.country_code),
      finances: !!newErrors.vat_number,
    });

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
