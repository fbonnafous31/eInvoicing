import React, { useState, useEffect } from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import InputField from '../../components/form/InputField';
import TextAreaField from '../../components/form/TextAreaField';
import { validateSeller } from '../../utils/validators';

countries.registerLocale(enLocale);

const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

const companyTypes = [
  { value: 'MICRO', label: 'Micro-entreprise' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'EIRL', label: 'EIRL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SARL', label: 'SARL' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SA', label: 'SA' },
  { value: 'SNC', label: 'SNC' },
  { value: 'SC', label: 'Société Civile' },
  { value: 'SCOP', label: 'SCOP' },
  { value: 'Association', label: 'Association' },
  { value: 'Autre', label: 'Autre' },
];

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

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // validation instantanée
    setErrors(validateSeller({ ...formData, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const newErrors = validateSeller(formData);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <InputField id="legal_name" name="legal_name" label="Nom légal *" value={formData.legal_name} onChange={handleChange} disabled={disabled} error={errors.legal_name} />
      <InputField id="legal_identifier" name="legal_identifier" label="Identifiant légal *" value={formData.legal_identifier} onChange={handleChange} disabled={disabled} error={errors.legal_identifier} />
      <InputField id="contact_email" name="contact_email" label="Email *" type="email" value={formData.contact_email} onChange={handleChange} disabled={disabled} error={errors.contact_email} />
      <InputField id="phone_number" name="phone_number" label="Téléphone" value={formData.phone_number} onChange={handleChange} disabled={disabled} error={errors.phone_number} />

      <select className="form-select mb-3" name="company_type" value={formData.company_type} disabled={disabled} onChange={handleChange}>
        {companyTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <TextAreaField id="address" name="address" label="Adresse *" value={formData.address} onChange={handleChange} disabled={disabled} error={errors.address} />
      <InputField id="city" name="city" label="Ville *" value={formData.city} onChange={handleChange} disabled={disabled} error={errors.city} />
      <InputField id="postal_code" name="postal_code" label="Code postal *" value={formData.postal_code} onChange={handleChange} disabled={disabled} error={errors.postal_code} />
      <select className="form-select mb-3" name="country_code" value={formData.country_code} disabled={disabled} onChange={handleChange}>
        {countryCodes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
      </select>

      <InputField id="vat_number" name="vat_number" label="Numéro de TVA" value={formData.vat_number} onChange={handleChange} disabled={disabled} />
      <TextAreaField id="registration_info" name="registration_info" label="Informations d’enregistrement *" value={formData.registration_info} onChange={handleChange} disabled={disabled} error={errors.registration_info} />
      <InputField id="share_capital" name="share_capital" label="Capital social" type="number" step="0.01" value={formData.share_capital} onChange={handleChange} disabled={disabled} />
      <TextAreaField id="bank_details" name="bank_details" label="Détails bancaires" value={formData.bank_details} onChange={handleChange} disabled={disabled} />

      {!disabled && (
        <div className="text-end mt-3">
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      )}
    </form>
  );
}
