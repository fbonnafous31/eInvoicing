// frontend/src/pages/sellers/SellerForm.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { LegalFields, ContactFields, AddressFields, FinanceFields, MentionsFields, SmtpFields } from './fields';
import useSellerForm from '../../modules/sellers/useSellerForm';
import { validateSeller } from '../../utils/validators/seller';
import SaveButton from '@/components/ui/buttons/SaveButton';

countries.registerLocale(enLocale);
const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

export default function SellerForm({ onSubmit, disabled = false, initialData = {} }) {
  const navigate = useNavigate();
  const {
    formData,
    errors,
    touched,
    openSections,
    toggleSection,
    handleChange,
    handleBlur,
    setErrors,
    setTouched,
    checkIdentifierAPI,
  } = useSellerForm(initialData);

  // ---------------------
  // Validation SMTP
  // ---------------------
  const validateSmtpFields = (data) => {
    const smtp = data.smtp || {};
    if (!smtp.active) return {};
    const smtpErrors = {};
    if (!smtp.smtp_host) smtpErrors.smtp_host = "Le host SMTP est requis";
    if (!smtp.smtp_port) smtpErrors.smtp_port = "Le port SMTP est requis";
    if (!smtp.smtp_user) smtpErrors.smtp_user = "L’utilisateur SMTP est requis";
    if (!smtp.smtp_pass) smtpErrors.smtp_pass = "Le mot de passe SMTP est requis";
    if (!smtp.smtp_from) smtpErrors.smtp_from = "L’email d’expéditeur est requis";
    return smtpErrors;
  };

  // ---------------------
  // Soumission du formulaire
  // ---------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFieldsTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allFieldsTouched);

    const cleanedSiret = (formData.legal_identifier || '').replace(/\D/g, '');
    let newErrors = validateSeller({ ...formData, legal_identifier: cleanedSiret });

    // Validation SMTP
    const smtpErrors = validateSmtpFields(formData);
    newErrors = { ...newErrors, ...smtpErrors };

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      openErrorSections(newErrors, allFieldsTouched);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 🔹 Vérification doublon seulement si le SIRET a changé
    if (cleanedSiret !== (initialData.legal_identifier || '').replace(/\D/g, '')) {
      const isIdentifierValid = await checkIdentifierAPI(cleanedSiret);
      if (!isIdentifierValid.valid) {
        newErrors = { ...newErrors, legal_identifier: 'Cet identifiant est déjà utilisé' };
        setErrors(newErrors);
        openErrorSections(newErrors, allFieldsTouched);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const payload = {
      ...formData,
      ...formData.smtp, 
      legal_identifier: formData.country_code === 'FR' ? cleanedSiret : formData.vat_number?.trim() || null,
    };

    try {
      await onSubmit?.(payload);
      navigate('/');
    } catch (err) {
      console.error(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ---------------------
  // Ouvre les sections qui contiennent des erreurs
  // ---------------------
  const openErrorSections = (errorsToCheck, fieldsTouched) => {
    Object.keys(openSections).forEach(section => {
      if (sectionHasError(section, errorsToCheck, fieldsTouched) && !openSections[section]) {
        toggleSection(section);
      }
    });
  };

  const sections = [
    { key: 'legal', label: 'Informations légales', component: LegalFields },
    { key: 'contact', label: 'Contact', component: ContactFields },
    { key: 'address', label: 'Adresse', component: AddressFields },
    { key: 'finances', label: 'Finances', component: FinanceFields },
    { key: 'mentions', label: 'Mentions complémentaires', component: MentionsFields },
    { key: 'smtp', label: 'Paramètres mail', component: SmtpFields }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      {sections.map(({ key, label, component }) => {
        const hasError = sectionHasError(key, errors, touched);
        const Component = component;

        return (
          <div className="mb-3" key={key}>
            <button
              type="button"
              className="btn btn-link p-0 mb-2"
              onClick={() => toggleSection(key)}
            >
              {label} {openSections[key] ? '▲' : '▼'} {hasError && '⚠️'}
            </button>

            {openSections[key] &&
              <Component
                formData={formData}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                handleBlur={handleBlur}
                disabled={disabled}
                countryCodes={key === 'address' ? countryCodes : undefined}
              />
            }
          </div>
        );
      })}

      {!disabled && (
        <div className="text-end mt-3">
          <SaveButton />
        </div>
      )}
    </form>
  );
}

// ---------------------
// Helper pour savoir si une section contient des erreurs
// ---------------------
function sectionHasError(section, errors, touched) {
  const mapping = {
    legal: ['legal_name', 'legal_identifier', 'company_type'],
    contact: ['contact_email', 'phone_number'],
    address: ['address', 'city', 'postal_code', 'country_code'],
    finances: ['vat_number', 'registration_info', 'share_capital', 'iban', 'bic', 'payment_method', 'payment_terms'],
    mentions: ['additional_1', 'additional_2'],
    smtp: ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from']
  };

  return Object.keys(errors).some(
    key => mapping[section]?.includes(key) && touched[key] && Boolean(errors[key])
  );
}
