// frontend/src/modules/clients/useClientForm.js
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
  const [siretExists, setSiretExists] = useState(false);
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: true,
    address: true,
    finances: true,
  });

  // Vérification SIRET côté API (sécurisée)
  const checkSiretAPI = async (siret) => {
    if (!siret || siret.length !== 14) {
      setSiretExists(false);
      setErrors(prev => ({
        ...prev,
        siret: siret ? undefined : prev.siret
      }));
      return;
    }

    try {
      const result = await checkSiret(siret);

      setSiretExists(result.exists);

      setErrors(prev => ({
        ...prev,
        siret: result.exists ? 'Ce SIRET est déjà utilisé' : undefined
      }));
    } catch (err) {
      console.error('Erreur fetch SIRET:', err);
      setSiretExists(false);
      setErrors(prev => ({ ...prev, siret: 'Impossible de vérifier le SIRET' }));
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Gestion du type de client
      if (field === 'is_company' && !value) {
        updated.siret = '';
        updated.legal_identifier = '';
        updated.vat_number = '';
      }

      // Synchronisation SIRET → legal_identifier
      if (field === 'siret') {
        const siretVal = (value || '').toString().replace(/\D/g, '');
        updated.siret = siretVal;
        if (updated.is_company && updated.country_code === 'FR') {
          updated.legal_identifier = siretVal;
        }
        checkSiretAPI(siretVal);
      }

      // Changement de pays
      if (field === 'country_code' && value !== 'FR') {
        updated.legal_identifier = prev.legal_identifier || '';
      }

      // Validation immédiate pour le champ
      const fieldError = validateClient(updated, field);
      setErrors(prevErrors => {
        const apiMsg = field === 'siret' && siretExists ? 'Ce SIRET est déjà utilisé' : undefined;
        return { ...prevErrors, [field]: apiMsg || fieldError[field] };
      });

      return updated;
    });
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldError = validateClient(formData, field);
    setErrors(prevErrors => {
      const apiMsg = field === 'siret' && siretExists ? 'Ce SIRET est déjà utilisé' : undefined;
      return { ...prevErrors, [field]: apiMsg || fieldError[field] };
    });
  };

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
    siretExists,
    openSections,
    toggleSection,
    handleChange,
    handleBlur,
  };
}
