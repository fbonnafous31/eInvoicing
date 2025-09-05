// frontend/src/modules/sellers/useSellerForm.js
import { useState } from 'react';
import { validateSeller } from '../../utils/validators/seller';

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
    mentions: true
  });

  const handleChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);

    const fieldError = validateSeller(updatedForm, field);
    setErrors(prev => ({ ...prev, [field]: fieldError[field] }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    const fieldError = validateSeller(formData, field);
    setErrors(prev => ({ ...prev, [field]: fieldError[field] }));
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ IMPORTANT : exposer setTouched pour pouvoir l’utiliser au submit
  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched, // ← ajouté
    handleChange,
    handleBlur,
    openSections,
    toggleSection,
  };
}
