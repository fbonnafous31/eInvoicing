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
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: true,
    address: true,
    finances: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    // Validation immédiate
    setErrors(validateSeller(updatedForm));
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    openSections,
    toggleSection,
    handleChange,
  };
}
