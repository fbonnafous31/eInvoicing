// frontend/src/pages/sellers/fields/SmtpFields.jsx
import React, { useState } from 'react';
import { InputField, CheckboxField, PasswordInput} from '@/components/form';
import { useSellerService } from '@/services/sellers';

export default function SmtpFields({ formData, handleChange, disabled, errors, setErrors }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const isDisabled = disabled || !formData.active;
  const sellerService = useSellerService();

  const handleCheckboxChange = (e) => {
    handleChange('active', e.target.checked);

    // Si on désactive l'envoi SMTP, on peut effacer les erreurs
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

  // Validation locale pour empêcher l'envoi de valeurs nulles
  const validateFields = () => {
    if (!formData.active) return true; // Pas actif = pas de validation SMTP

    const newErrors = {};
    if (!formData.smtp_host) newErrors.smtp_host = 'Le host SMTP est requis';
    if (!formData.smtp_port) newErrors.smtp_port = 'Le port SMTP est requis';
    if (!formData.smtp_user) newErrors.smtp_user = 'L’utilisateur SMTP est requis';
    if (!formData.smtp_pass) newErrors.smtp_pass = 'Le mot de passe SMTP est requis';
    if (!formData.smtp_from) newErrors.smtp_from = 'L’email d’expéditeur est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors?.(prev => ({ ...prev, ...newErrors }));
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

      const data = await Promise.race([sellerService.testSmtp(formData), timeoutPromise]);

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
        checked={formData.active || false}
        onChange={handleCheckboxChange}
        disabled={disabled}
      />

      <InputField
        id="smtp_host"
        name="smtp_host"
        label="SMTP Host"
        value={formData.smtp_host || ''}
        onChange={(value) => handleChange('smtp_host', value)}
        disabled={isDisabled}
        error={errors.smtp_host}
        helpText="Ex: smtp.gmail.com"
      />

      <InputField
        id="smtp_port"
        name="smtp_port"
        label="SMTP Port"
        type="number"
        value={formData.smtp_port || ''}
        onChange={(value) => handleChange('smtp_port', parseInt(value) || '')}
        disabled={isDisabled}
        error={errors.smtp_port}
        helpText="Ex: 587"
      />

      <CheckboxField
        id="smtp_secure"
        name="smtp_secure"
        label="Connexion sécurisée (SSL/TLS)"
        checked={formData.smtp_secure || false}
        onChange={(e) => handleChange('smtp_secure', e.target.checked)}
        disabled={isDisabled}
      />

      <InputField
        id="smtp_user"
        name="smtp_user"
        label="Utilisateur SMTP (email)"
        value={formData.smtp_user || ''}
        onChange={(value) => handleChange('smtp_user', value)}
        disabled={isDisabled}
        error={errors.smtp_user}
      />

      <PasswordInput
        value={formData.smtp_pass}
        onChange={(value) => handleChange('smtp_pass', value)}
        error={errors.smtp_pass}
        disabled={isDisabled}
        helpText="Mot de passe d'application si nécessaire."
      />

      <InputField
        id="smtp_from"
        name="smtp_from"
        label="Email d'expéditeur"
        value={formData.smtp_from || ''}
        onChange={(value) => handleChange('smtp_from', value)}
        disabled={isDisabled}
        error={errors.smtp_from}
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
