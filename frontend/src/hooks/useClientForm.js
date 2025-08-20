// frontend/src/hooks/useClientForm.js
import { useState } from 'react';
import { validatePerson } from '../utils/validators';

export default function useClientForm(initialData = {}) {
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
    phone: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [siretExists, setSiretExists] = useState(false);
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: false,
    address: false,
    finances: false,
  });

  // Vérification SIRET côté API
  const checkSiretAPI = async (siret) => {
    if (!siret || siret.length !== 14) {
      setSiretExists(false);
      setErrors((prev) => ({ ...prev, siret: undefined }));
      return;
    }
    try {
      const res = await fetch(`/api/clients/check-siret/${siret}`);
      const data = await res.json();
      setSiretExists(data.exists);
      setErrors((prev) => ({ ...prev, siret: data.exists ? 'Ce SIRET est déjà utilisé' : undefined }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let val = value ?? '';

    setFormData((prev) => {
      const updated = { ...prev };

      if (name === 'is_company') {
        val = value === 'true';
        updated.is_company = val;

        if (!val) {
          updated.siret = '';
          updated.legal_identifier = '';
          updated.vat_number = '';
        }
      } else if (type === 'checkbox') {
        updated[name] = e.target.checked;
      } else {
        updated[name] = val;
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
      setErrors(newErrors);

      return updated;
    });
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    siretExists,
    openSections,
    toggleSection,
    handleChange,
  };
}
