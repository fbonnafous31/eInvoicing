// src/pages/sellers/fields/SmtpFields.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SmtpFields from './SmtpFields';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/components/form', () => ({
  InputField: ({ id, label, value, onChange, disabled, error }) => (
    <>
      <input
        data-testid={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && <span data-testid={`${id}-error`}>{error}</span>}
    </>
  ),
  CheckboxField: ({ id, label, checked, onChange, disabled }) => (
    <input
      data-testid={id}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  ),
}));

const mockTestSmtpResend = vi.fn();
vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({ testSmtpResend: mockTestSmtpResend }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultSmtp = { active: true, smtp_from: 'from@example.com' };

function renderSmtp(smtpOverride = {}, props = {}) {
  const handleChange = vi.fn();
  const setErrors = vi.fn();
  const errors = {};
  const result = render(
    <SmtpFields
      formData={{ smtp: { ...defaultSmtp, ...smtpOverride } }}
      handleChange={handleChange}
      errors={errors}
      setErrors={setErrors}
      {...props}
    />
  );
  return { ...result, handleChange, setErrors };
}

beforeEach(() => {
  mockTestSmtpResend.mockReset();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SmtpFields', () => {

  // ── Rendu initial ──────────────────────────────────────────────────────────

  describe('rendu initial', () => {
    it('affiche la checkbox cochée et le champ smtp_from', () => {
      renderSmtp();
      expect(screen.getByTestId('smtp_active')).toBeChecked();
      expect(screen.getByTestId('smtp_from')).toHaveValue('from@example.com');
    });

    it('ne crash pas si formData.smtp est absent (défaut {})', () => {
      expect(() =>
        render(
          <SmtpFields
            formData={{}}
            handleChange={vi.fn()}
            errors={{}}
            setErrors={vi.fn()}
          />
        )
      ).not.toThrow();
      expect(screen.getByTestId('smtp_active')).not.toBeChecked();
    });

    it("affiche l'erreur smtp_from si présente dans errors", () => {
      render(
        <SmtpFields
          formData={{ smtp: defaultSmtp }}
          handleChange={vi.fn()}
          errors={{ smtp_from: "L'email d'expéditeur est requis" }}
          setErrors={vi.fn()}
        />
      );
      expect(screen.getByTestId('smtp_from-error')).toHaveTextContent(
        "L'email d'expéditeur est requis"
      );
    });
  });

  // ── Checkbox ───────────────────────────────────────────────────────────────

  describe('checkbox smtp.active', () => {
    it('appelle handleChange avec active: false quand on décoche', () => {
      const { handleChange } = renderSmtp({ active: true });
      fireEvent.click(screen.getByTestId('smtp_active'));
      expect(handleChange).toHaveBeenCalledWith(
        'smtp',
        expect.objectContaining({ active: false })
      );
    });

    it('appelle handleChange avec active: true quand on coche', () => {
      const { handleChange } = renderSmtp({ active: false });
      fireEvent.click(screen.getByTestId('smtp_active'));
      expect(handleChange).toHaveBeenCalledWith(
        'smtp',
        expect.objectContaining({ active: true })
      );
    });

    it("supprime l'erreur smtp_from dans setErrors quand on décoche", () => {
      const setErrors = vi.fn();
      render(
        <SmtpFields
          formData={{ smtp: defaultSmtp }}
          handleChange={vi.fn()}
          errors={{ smtp_from: 'requis' }}
          setErrors={setErrors}
        />
      );
      fireEvent.click(screen.getByTestId('smtp_active'));

      // setErrors reçoit une fonction updater — on la simule
      const updater = setErrors.mock.calls[0][0];
      const result = updater({ smtp_from: 'requis', autre: 'ok' });
      expect(result).not.toHaveProperty('smtp_from');
      expect(result).toHaveProperty('autre', 'ok');
    });

    it('ne crash pas si setErrors est undefined lors du décocher', () => {
      expect(() => {
        render(
          <SmtpFields
            formData={{ smtp: defaultSmtp }}
            handleChange={vi.fn()}
            errors={{}}
            // pas de setErrors
          />
        );
        fireEvent.click(screen.getByTestId('smtp_active'));
      }).not.toThrow();
    });

    it('la checkbox est désactivée si disabled=true', () => {
      renderSmtp({}, { disabled: true });
      expect(screen.getByTestId('smtp_active')).toBeDisabled();
    });
  });

  // ── Champ smtp_from ────────────────────────────────────────────────────────

  describe('champ smtp_from', () => {
    it('appelle handleChange avec la nouvelle valeur', () => {
      const { handleChange } = renderSmtp();
      fireEvent.change(screen.getByTestId('smtp_from'), {
        target: { value: 'nouveau@test.com' },
      });
      expect(handleChange).toHaveBeenCalledWith(
        'smtp',
        expect.objectContaining({ smtp_from: 'nouveau@test.com' })
      );
    });

    it('est désactivé si smtp.active=false', () => {
      renderSmtp({ active: false });
      expect(screen.getByTestId('smtp_from')).toBeDisabled();
    });

    it('est désactivé si disabled=true même avec smtp.active=true', () => {
      renderSmtp({ active: true }, { disabled: true });
      expect(screen.getByTestId('smtp_from')).toBeDisabled();
    });
  });

  // ── Bouton test SMTP ───────────────────────────────────────────────────────

  describe('bouton "Envoyer un email de test"', () => {
    it('est désactivé si smtp.active=false', () => {
      renderSmtp({ active: false });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('est désactivé si disabled=true', () => {
      renderSmtp({}, { disabled: true });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it("réinitialise testResult à null avant chaque nouvel envoi", async () => {
      mockTestSmtpResend
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Deuxième erreur' });

      renderSmtp();

      // Premier envoi
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Email envoyé ✅'));

      // Deuxième envoi — l'ancien résultat doit disparaître pendant l'envoi
      fireEvent.click(screen.getByRole('button'));
      // Pendant l'envoi, testResult est null → pas de message
      // Puis le nouveau résultat arrive
      await waitFor(() => screen.getByText('Deuxième erreur'));
      expect(screen.queryByText('Email envoyé ✅')).toBeNull();
    });
  });

  // ── Résultats du test SMTP ─────────────────────────────────────────────────

  describe('résultats testSmtpResend', () => {
    it('affiche le succès avec classe text-success', async () => {
      mockTestSmtpResend.mockResolvedValueOnce({ success: true });
      renderSmtp();
      fireEvent.click(screen.getByRole('button'));
      const msg = await screen.findByText('Email envoyé ✅');
      expect(msg.className).toContain('text-success');
    });

    it("affiche data.error si success=false avec un message d'erreur", async () => {
      mockTestSmtpResend.mockResolvedValueOnce({
        success: false,
        error: 'Clé API invalide',
      });
      renderSmtp();
      fireEvent.click(screen.getByRole('button'));
      const msg = await screen.findByText('Clé API invalide');
      expect(msg.className).toContain('text-danger');
    });

    it("affiche 'Erreur inconnue' si success=false sans data.error", async () => {
      mockTestSmtpResend.mockResolvedValueOnce({ success: false });
      renderSmtp();
      fireEvent.click(screen.getByRole('button'));
      await screen.findByText('Erreur inconnue');
    });

    it("affiche err.message si l'appel lance une exception", async () => {
      mockTestSmtpResend.mockRejectedValueOnce(new Error('Network timeout'));
      renderSmtp();
      fireEvent.click(screen.getByRole('button'));
      await screen.findByText('Network timeout');
    });
  });

  // ── validateFields ─────────────────────────────────────────────────────────

  describe('validateFields', () => {
    it("bloque l'envoi et appelle setErrors si smtp_from est vide", async () => {
      const setErrors = vi.fn();
      render(
        <SmtpFields
          formData={{ smtp: { active: true, smtp_from: '' } }}
          handleChange={vi.fn()}
          errors={{}}
          setErrors={setErrors}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(mockTestSmtpResend).not.toHaveBeenCalled();

      const updater = setErrors.mock.calls[0][0];
      const result = updater({});
      expect(result).toHaveProperty('smtp_from');
    });

    it("ne bloque pas si smtp.active=false (pas de validation requise)", () => {
      // active=false → le bouton est disabled, validateFields retourne true
      // Ce test vérifie la logique : si active=false, pas de validation
      renderSmtp({ active: false, smtp_from: '' });
      // Le bouton est disabled — on vérifie juste que validateFields ne s'exécute pas
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it("n'appelle pas setErrors si setErrors est undefined lors de la validation", () => {
      expect(() => {
        render(
          <SmtpFields
            formData={{ smtp: { active: true, smtp_from: '' } }}
            handleChange={vi.fn()}
            errors={{}}
            // pas de setErrors
          />
        );
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });
});