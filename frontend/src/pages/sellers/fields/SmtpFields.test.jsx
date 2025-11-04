// src/pages/sellers/fields/SmtpFields.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import SmtpFields from './SmtpFields';

// 🔹 Mock des composants form
vi.mock('@/components/form', () => ({
  InputField: ({ id, value, onChange, disabled }) => (
    <input
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
  CheckboxField: ({ id, checked, onChange, disabled }) => (
    <input
      data-testid={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  ),
}));

// 🔹 Mock du service
const mockTestSmtpResend = vi.fn();
vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    testSmtpResend: mockTestSmtpResend,
  }),
}));

describe('SmtpFields', () => {
  let formData, handleChange, setErrors;

  beforeEach(() => {
    formData = {
      smtp: {
        active: true,
        smtp_from: 'from@example.com',
      },
    };
    handleChange = vi.fn();
    setErrors = vi.fn();
    mockTestSmtpResend.mockReset();
  });

  it('rend le champ actif avec les valeurs initiales', () => {
    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    expect(screen.getByTestId('smtp_active')).toBeChecked();
    expect(screen.getByTestId('smtp_from')).toHaveValue(formData.smtp.smtp_from);
  });

  it('modifie le champ smtp_from et appelle handleChange', () => {
    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    fireEvent.change(screen.getByTestId('smtp_from'), { target: { value: 'test@resend.dev' } });
    expect(handleChange).toHaveBeenCalledWith('smtp', expect.objectContaining({ smtp_from: 'test@resend.dev' }));
  });

  it('désactive le champ si smtp.active=false ou disabled=true', () => {
    const { rerender } = render(
      <SmtpFields formData={{ smtp: { ...formData.smtp, active: false } }} handleChange={handleChange} errors={{}} setErrors={setErrors} />
    );
    expect(screen.getByTestId('smtp_from')).toBeDisabled();

    rerender(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} disabled={true} />);
    expect(screen.getByTestId('smtp_from')).toBeDisabled();
  });

  it('teste la connexion SMTP avec succès', async () => {
    mockTestSmtpResend.mockResolvedValueOnce({ success: true });

    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    fireEvent.click(screen.getByText('Envoyer un email de test'));

    await waitFor(() => expect(screen.getByText('Email envoyé ✅')).toBeInTheDocument());
    expect(mockTestSmtpResend).toHaveBeenCalledWith({ smtp_from: formData.smtp.smtp_from });
  });

  it('affiche une erreur si testSmtpResend lance une exception', async () => {
    mockTestSmtpResend.mockRejectedValueOnce(new Error('Resend fail'));

    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    fireEvent.click(screen.getByText('Envoyer un email de test'));

    await waitFor(() => expect(screen.getByText('Resend fail')).toBeInTheDocument());
  });
});
