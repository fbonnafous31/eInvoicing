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
  PasswordInput: ({ value, onChange, disabled }) => (
    <input
      data-testid="smtp_pass"
      type="password"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

// 🔹 Mock du service
const mockTestSmtp = vi.fn();
vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    testSmtp: mockTestSmtp,
  }),
}));

describe('SmtpFields', () => {
  let formData, handleChange, setErrors;

  beforeEach(() => {
    formData = {
      smtp: {
        active: true,
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        smtp_secure: true,
        smtp_user: 'user@example.com',
        smtp_pass: 'password',
        smtp_from: 'from@example.com',
      },
    };
    handleChange = vi.fn();
    setErrors = vi.fn();
    mockTestSmtp.mockReset();
  });

  it('rend tous les champs avec les valeurs initiales', () => {
    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    expect(screen.getByTestId('smtp_active')).toBeChecked();
    expect(screen.getByTestId('smtp_host')).toHaveValue(formData.smtp.smtp_host);
    expect(screen.getByTestId('smtp_port')).toHaveValue(String(formData.smtp.smtp_port));
    expect(screen.getByTestId('smtp_user')).toHaveValue(formData.smtp.smtp_user);
    expect(screen.getByTestId('smtp_pass')).toHaveValue(formData.smtp.smtp_pass);
    expect(screen.getByTestId('smtp_from')).toHaveValue(formData.smtp.smtp_from);
  });

  it('appelle handleChange quand on modifie un champ', () => {
    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    fireEvent.change(screen.getByTestId('smtp_host'), { target: { value: 'smtp.test.com' } });
    expect(handleChange).toHaveBeenCalledWith('smtp', expect.objectContaining({ smtp_host: 'smtp.test.com' }));

    fireEvent.change(screen.getByTestId('smtp_port'), { target: { value: '465' } });
    expect(handleChange).toHaveBeenCalledWith('smtp', expect.objectContaining({ smtp_port: 465 }));

    fireEvent.change(screen.getByTestId('smtp_pass'), { target: { value: 'newpass' } });
    expect(handleChange).toHaveBeenCalledWith('smtp', expect.objectContaining({ smtp_pass: 'newpass' }));
  });

  it('désactive tous les champs si active=false ou disabled=true', () => {
    const { rerender } = render(
      <SmtpFields formData={{ smtp: { ...formData.smtp, active: false } }} handleChange={handleChange} errors={{}} setErrors={setErrors} />
    );
    expect(screen.getByTestId('smtp_host')).toBeDisabled();
    expect(screen.getByTestId('smtp_port')).toBeDisabled();

    rerender(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} disabled={true} />);
    expect(screen.getByTestId('smtp_host')).toBeDisabled();
    expect(screen.getByTestId('smtp_port')).toBeDisabled();
  });

  it('teste la connexion SMTP et affiche le résultat', async () => {
    mockTestSmtp.mockResolvedValueOnce({ success: true });

    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    fireEvent.click(screen.getByText('Tester la configuration'));

    await waitFor(() => expect(screen.getByText('Connexion réussie ✅')).toBeInTheDocument());
  });

  it('affiche une erreur si la connexion échoue', async () => {
    mockTestSmtp.mockResolvedValueOnce({ success: false, error: 'Auth failed' });

    render(<SmtpFields formData={formData} handleChange={handleChange} errors={{}} setErrors={setErrors} />);

    fireEvent.click(screen.getByText('Tester la configuration'));

    await waitFor(() => expect(screen.getByText('Erreur : Auth failed')).toBeInTheDocument());
  });
});
