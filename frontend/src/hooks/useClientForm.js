// frontend/src/hooks/useClientForm.js
import { useState, useEffect } from "react";
import { validateClient } from "../utils/validators/client";
import { checkSiret } from "../services/clients";

export default function useClientForm(initialData = {}, onSubmit) {
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
  const [openSections, setOpenSections] = useState({
    legal: true,
    contact: false,
    address: false,
    finances: false,
  });
  const [siretExists, setSiretExists] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = async (e) => {
    const { name, value, type } = e.target;
    let val = value ?? '';

    if (name === 'is_company') val = value === 'true';
    else if (type === 'checkbox') val = e.target.checked;

    setFormData(prev => {
      const updated = { ...prev, [name]: val };

      // Si c'est un particulier, on vide SIRET et TVA
      if (name === 'is_company' && !val) {
        updated.siret = '';
        updated.legal_identifier = '';
        updated.vat_number = '';
      }

      // Synchronisation SIRET -> legal_identifier FR
      if (name === 'siret') {
        const siretVal = (val || '').replace(/\D/g, '');
        updated.siret = siretVal;
        if (updated.is_company && updated.country_code === 'FR') updated.legal_identifier = siretVal;

        // Vérification API SIRET
        if (siretVal.length === 14) {
          checkSiret(siretVal)
            .then(({ exists }) => {
              setSiretExists(exists);
              setErrors(prev => ({ ...prev, siret: exists ? "Ce SIRET est déjà utilisé" : undefined }));
            })
            .catch(console.error);
        } else {
          setSiretExists(false);
          setErrors(prev => ({ ...prev, siret: undefined }));
        }
      }

      // Changement de pays hors FR
      if (name === 'country_code' && val !== 'FR') {
        updated.legal_identifier = prev.legal_identifier || '';
      }

      const newErrors = validateClient(updated);
      setErrors(prev => ({ ...prev, ...newErrors }));

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedSiret = (formData.siret || '').replace(/\D/g, '');
    const newErrors = validateClient({ ...formData, siret: cleanedSiret });

    if (formData.is_company) {
      if (formData.country_code === 'FR') {
        if (!cleanedSiret) newErrors.siret = "Le SIRET est requis pour une entreprise française";
        else if (cleanedSiret.length !== 14) newErrors.siret = "Le SIRET doit contenir 14 chiffres";
      } else if (!formData.vat_number?.trim()) {
        newErrors.vat_number = "Le numéro de TVA intracommunautaire est requis pour les entreprises non françaises";
      }
    }

    if (siretExists) newErrors.siret = "Ce SIRET est déjà utilisé";

    setErrors(newErrors);

    // Sections avec erreurs ouvertes automatiquement
    setOpenSections({
      legal: !!(
        (formData.is_company && (newErrors.legal_name || newErrors.siret || newErrors.legal_identifier)) ||
        (!formData.is_company && (newErrors.firstname || newErrors.lastname))
      ),
      contact: !!(newErrors.email || newErrors.phone),
      address: !!(newErrors.address || newErrors.city || newErrors.postal_code || newErrors.country_code),
      finances: !!newErrors.vat_number,
    });

    if (Object.keys(newErrors).length === 0 && onSubmit) {
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
      onSubmit(payload);
    }
  };

  return { formData, errors, openSections, toggleSection, handleChange, handleSubmit };
}
