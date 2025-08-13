import React, { useState, useEffect } from 'react';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({
  code,
  name,
}));



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
  });

  // Mettre à jour le formulaire quand initialData change
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        legal_name: initialData.legal_name || '',
        legal_identifier: initialData.legal_identifier || '',
        address: initialData.address || '',
        city: initialData.city || '',
        postal_code: initialData.postal_code || '',
        country_code: initialData.country_code || 'FR',
        vat_number: initialData.vat_number || '',
        registration_info: initialData.registration_info || '',
        share_capital: initialData.share_capital || '',
        bank_details: initialData.bank_details || '',
      });
    }
  }, [initialData]);

  // Mise à jour des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <div className="mb-3">
        <label htmlFor="legal_name" className="form-label">Nom légal *</label>
        <input
          type="text"
          id="legal_name"
          name="legal_name"
          className="form-control"
          maxLength={255}
          required
          disabled={disabled}
          value={formData.legal_name}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="legal_identifier" className="form-label">Identifiant légal</label>
        <input
          type="text"
          id="legal_identifier"
          name="legal_identifier"
          className="form-control"
          maxLength={50}
          disabled={disabled}
          value={formData.legal_identifier}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="address" className="form-label">Adresse</label>
        <textarea
          id="address"
          name="address"
          className="form-control"
          rows="2"
          disabled={disabled}
          value={formData.address}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="city" className="form-label">Ville</label>
          <input
            type="text"
            id="city"
            name="city"
            className="form-control"
            maxLength={100}
            disabled={disabled}
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="postal_code" className="form-label">Code postal</label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            className="form-control"
            maxLength={20}
            disabled={disabled}
            value={formData.postal_code}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="country_code" className="form-label">Code pays</label>
          <select
            id="country_code"
            name="country_code"
            className="form-select"
            disabled={disabled}
            value={formData.country_code}
            onChange={handleChange}
          >
            {countryCodes.map(({ code, name }) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="vat_number" className="form-label">Numéro de TVA</label>
        <input
          type="text"
          id="vat_number"
          name="vat_number"
          className="form-control"
          maxLength={50}
          disabled={disabled}
          value={formData.vat_number}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="registration_info" className="form-label">Informations d’enregistrement</label>
        <textarea
          id="registration_info"
          name="registration_info"
          className="form-control"
          rows="2"
          disabled={disabled}
          value={formData.registration_info}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="mb-3">
        <label htmlFor="share_capital" className="form-label">Capital social</label>
        <input
          type="number"
          step="0.01"
          id="share_capital"
          name="share_capital"
          className="form-control"
          disabled={disabled}
          value={formData.share_capital}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="bank_details" className="form-label">Détails bancaires</label>
        <textarea
          id="bank_details"
          name="bank_details"
          className="form-control"
          rows="2"
          disabled={disabled}
          value={formData.bank_details}
          onChange={handleChange}
        ></textarea>
      </div>

      {!disabled && (
        <button type="submit" className="btn btn-primary">
          Créer le vendeur
        </button>
      )}

    </form>
  );
}
