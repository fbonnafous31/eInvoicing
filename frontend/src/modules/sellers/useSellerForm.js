// frontend/src/modules/sellers/useSellerForm.js
import { useState, useCallback } from 'react';
import { validateSeller } from '../../utils/validators/seller';
import { useSellerService } from '@/services/sellers';

export default function useSellerForm(initialData = {}) {
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
    iban: '',
    bic: '',
    contact_email: '',
    phone_number: '',
    company_type: 'MICRO',
    additional_1: '',
    additional_2: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: true,
    address: true,
    finances: true,
    mentions: true,
  });

  const { checkIdentifier } = useSellerService(); // exemple de vérif API si besoin

  // ----------------------
  // Vérification asynchrone (ex. legal_identifier)
  // ----------------------
  const checkIdentifierAPI = useCallback(
    async (identifier) => {
      if (!identifier) return { valid: true };
      try {
        const result = await checkIdentifier(identifier, formData.id || undefined);
        if (result.exists) {
          setErrors(prev => ({ ...prev, legal_identifier: 'Cet identifiant est déjà utilisé' }));
          return { valid: false };
        } else {
          setErrors(prev => ({ ...prev, legal_identifier: undefined }));
          return { valid: true };
        }
      } catch (err) {
        console.error(err);
        setErrors(prev => ({ ...prev, legal_identifier: 'Impossible de vérifier l’identifiant' }));
        return { valid: false };
      }
    },
    [checkIdentifier, formData.id]
  );

  // ----------------------
  // Handle Change
  // ----------------------
  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      const fieldError = validateSeller(updated, field);
      setErrors(prevErrors => {
        if (field === 'legal_identifier' && prevErrors.legal_identifier?.includes('déjà utilisé')) {
          return prevErrors;
        }
        return { ...prevErrors, [field]: fieldError[field] };
      });

      if (field === 'legal_identifier') {
        checkIdentifierAPI(value);
      }

      return updated;
    });
  };

  // ----------------------
  // Handle Blur
  // ----------------------
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    const fieldError = validateSeller(formData, field);
    setErrors(prevErrors => {
      if (field === 'legal_identifier' && prevErrors.legal_identifier?.includes('déjà utilisé')) {
        return prevErrors;
      }
      return { ...prevErrors, [field]: fieldError[field] };
    });

    if (field === 'legal_identifier') {
      checkIdentifierAPI(formData.legal_identifier);
    }
  };

  // ----------------------
  // Toggle section
  // ----------------------
  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched, // pour le submit
    handleChange,
    handleBlur,
    openSections,
    toggleSection,
    checkIdentifierAPI, // exposé si besoin côté composant
  };
}
