// frontend/src/pages/sellers/fields/SmtpFields.jsx
import React, { useState } from 'react';
import { InputField, CheckboxField, PasswordInput } from '@/components/form';
import { useSellerService } from '@/services/sellers';

export default function SmtpFields({ formData, handleChange, disabled, errors, setErrors }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const sellerService = useSellerService();

  // Assurer que formData.smtp existe
  const smtp = formData.smtp || {};

  const isDisabled = disabled || !smtp.active;

  const handleCheckboxChange = (e) => {
    handleChange('smtp', { ...smtp, active: e.target.checked });

    if (!e.target.checked && setErrors) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.smtp_host;
        delete copy.smtp_port;
        delete copy.smtp_user;
        delete copy.smtp_pass;
        delete copy.smtp_from;
        return copy;
      });
    }
  };

  const handleSmtpChange = (field, value) => {
    handleChange('smtp', { ...smtp, [field]: value });
  };

  const validateFields = () => {
    if (!smtp.active) return true;

    const newErrors = {};
    if (!smtp.smtp_host) newErrors.smtp_host = 'Le host SMTP est requis';
    if (!smtp.smtp_port) newErrors.smtp_port = 'Le port SMTP est requis';
    if (!smtp.smtp_user) newErrors.smtp_user = 'L’utilisateur SMTP est requis';
    if (!smtp.smtp_pass) newErrors.smtp_pass = 'Le mot de passe SMTP est requis';
    if (!smtp.smtp_from) newErrors.smtp_from = 'L’email d’expéditeur est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors?.((prev) => ({ ...prev, ...newErrors }));
      return false;
    }
    return true;
  };

  const handleTestConnection = async () => {
    if (!validateFields()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connexion expirée')), 5000)
      );

      const data = await Promise.race([sellerService.testSmtp(smtp), timeoutPromise]);

      if (data.success) {
        setTestResult({ message: 'Connexion réussie ✅', success: true });
      } else {
        setTestResult({ message: `Erreur : ${data.error || 'non spécifiée'}`, success: false });
      }
    } catch (err) {
      setTestResult({ message: `Erreur : ${err.message}`, success: false });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border p-3 rounded mb-3 bg-light">
      <CheckboxField
        id="smtp_active"
        name="active"
        label="Activer l'envoi de mails"
        checked={smtp.active || false}
        onChange={handleCheckboxChange}
        disabled={disabled}
      />

      <InputField
        id="smtp_host"
        name="smtp_host"
        label="SMTP Host"
        value={smtp.smtp_host || ''}
        onChange={(value) => handleSmtpChange('smtp_host', value)}
        disabled={isDisabled}
        error={errors?.smtp_host}
        helpText="Ex: smtp.gmail.com"
      />

      <InputField
        id="smtp_port"
        name="smtp_port"
        label="SMTP Port"
        type="number"
        value={smtp.smtp_port || ''}
        onChange={(value) => handleSmtpChange('smtp_port', parseInt(value) || '')}
        disabled={isDisabled}
        error={errors?.smtp_port}
        helpText="Ex: 587"
      />

      <CheckboxField
        id="smtp_secure"
        name="smtp_secure"
        label="Connexion sécurisée (SSL/TLS)"
        checked={smtp.smtp_secure || false}
        onChange={(e) => handleSmtpChange('smtp_secure', e.target.checked)}
        disabled={isDisabled}
      />

      <InputField
        id="smtp_user"
        name="smtp_user"
        label="Utilisateur SMTP (email)"
        value={smtp.smtp_user || ''}
        onChange={(value) => handleSmtpChange('smtp_user', value)}
        disabled={isDisabled}
        error={errors?.smtp_user}
      />

      <PasswordInput
        value={smtp.smtp_pass || ''}
        onChange={(value) => handleSmtpChange('smtp_pass', value)}
        error={errors?.smtp_pass}
        disabled={isDisabled}
        helpText="Mot de passe d'application si nécessaire."
      />

      <InputField
        id="smtp_from"
        name="smtp_from"
        label="Email d'expéditeur"
        value={smtp.smtp_from || ''}
        onChange={(value) => handleSmtpChange('smtp_from', value)}
        disabled={isDisabled}
        error={errors?.smtp_from}
      />

      <button
        type="button"
        className="btn btn-outline-primary mt-2"
        onClick={handleTestConnection}
        disabled={isDisabled || testing}
      >
        {testing ? 'Test en cours...' : 'Tester la configuration'}
      </button>

      {testResult && (
        <div className={`mt-2 ${testResult.success ? 'text-success' : 'text-danger'}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
}
