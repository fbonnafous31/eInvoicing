import React, { useState } from 'react';
import { InputField, CheckboxField } from '@/components/form';
import { useSellerService } from '@/services/sellers';

export default function SmtpFields({ formData, handleChange, disabled, errors, setErrors }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const sellerService = useSellerService();

  const smtp = formData.smtp || {};
  const isDisabled = disabled || !smtp.active;

  const handleCheckboxChange = (e) => {
    handleChange('smtp', { ...smtp, active: e.target.checked });

    if (!e.target.checked && setErrors) {
      setErrors((prev) => {
        const copy = { ...prev };
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
      const data = await sellerService.testSmtpResend({ smtp_from: smtp.smtp_from });

      if (data.success) {
        setTestResult({ success: true, message: 'Email envoyé ✅' });
      } else {
        setTestResult({ success: false, message: data.error || 'Erreur inconnue' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border p-3 rounded mb-3 bg-light">
      <CheckboxField
        id="smtp_active"
        name="active"
        label="Activer l’envoi d’emails"
        checked={smtp.active || false}
        onChange={handleCheckboxChange}
        disabled={disabled}
      />

      <InputField
        id="smtp_from"
        name="smtp_from"
        label="Email d’expéditeur"
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
        {testing ? 'Envoi en cours...' : 'Envoyer un email de test'}
      </button>

      {testResult && (
        <div className={`mt-2 ${testResult.success ? 'text-success' : 'text-danger'}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
}
