import { useState } from 'react';
import { validateClient } from '../../utils/validators/client';
import { checkSiret } from '../../services/clients';

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
  const [touched, setTouched] = useState({});
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: true,
    address: true,
    finances: true,
  });

  // ----------------------
  // Vérification SIRET côté API
  // ----------------------
  const checkSiretAPI = async (siret) => {
    if (!siret || siret.length !== 14) return { valid: true };

    try {
      const result = await checkSiret(siret, formData.id || undefined);
      // En création, formData.id est undefined
      if (result.exists) {
        setErrors(prev => ({ ...prev, siret: 'Ce SIRET est déjà utilisé par un autre client' }));
        return { valid: false };
      } else {
        setErrors(prev => ({ ...prev, siret: undefined }));
        return { valid: true };
      }
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, siret: 'Impossible de vérifier le SIRET' }));
      return { valid: false };
    }
  };

  // ----------------------
  // Handle Change
  // ----------------------
  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Validation locale
      const fieldError = validateClient(updated, field);
      setErrors(prevErrors => {
        if (field === 'siret' && prevErrors.siret?.includes('déjà utilisé')) return prevErrors;
        return { ...prevErrors, [field]: fieldError[field] };
      });

      // Vérification asynchrone pour SIRET
      if (field === 'siret') {
        const cleaned = (value || '').replace(/\D/g, '');
        if (cleaned.length === 14) { 
          checkSiretAPI(cleaned); 
        }               
      }

      return updated;
    });
  };

  // ----------------------
  // Handle Blur
  // ----------------------
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    const fieldError = validateClient(formData, field);

    setErrors(prevErrors => {
      // Si le champ est le SIRET et qu'un message API existe, on ne l'écrase pas
      if (field === 'siret' && prevErrors.siret?.includes('déjà utilisé')) {
        return prevErrors;
      }
      return { ...prevErrors, [field]: fieldError[field] };
    });

    // Vérification asynchrone pour SIRET si nécessaire
    if (field === 'siret') {
      const cleaned = (formData.siret || '').replace(/\D/g, '');
      if (cleaned.length === 14) {
        checkSiretAPI(cleaned);
      }
    }
  };

  // ----------------------
  // Toggle section
  // ----------------------
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    openSections,
    toggleSection,
    handleChange,
    handleBlur,
    checkSiretAPI, // on expose pour handleSubmit
  };
}
