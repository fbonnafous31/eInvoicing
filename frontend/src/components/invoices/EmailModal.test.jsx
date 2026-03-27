// EmailModal.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import EmailModal from './EmailModal';

// ---------------------------------------------------------------------------
// Mock de validateEmail pour contrôler les scénarios d'erreur
// ---------------------------------------------------------------------------

const mockValidateEmail = vi.fn();
vi.mock('../../utils/validators/email', () => ({
  validateEmail: (val) => mockValidateEmail(val),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_EMAIL = 'client@test.com';
const INVALID_EMAIL = 'pas-un-email';

const defaultValues = {
  to: VALID_EMAIL,
  subject: 'Facture',
  message: 'Voici votre facture',
};

const emptyDefaultValues = { to: '', subject: '', message: '' };

function renderModal(props = {}) {
  return render(
    <EmailModal
      show={true}
      onSend={vi.fn()}
      onClose={vi.fn()}
      defaultValues={defaultValues}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// 1. Rendu initial
// ---------------------------------------------------------------------------

describe('EmailModal — rendu initial', () => {
  beforeEach(() => {
    mockValidateEmail.mockReturnValue(null); // email valide par défaut
  });

  afterEach(() => vi.clearAllMocks());

  it('affiche les valeurs par défaut dans les champs', () => {
    renderModal();
    expect(screen.getByDisplayValue(VALID_EMAIL)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Facture')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Voici votre facture')).toBeInTheDocument();
  });

  it('ne plante pas si defaultValues est vide', () => {
    mockValidateEmail.mockReturnValue("Email requis");
    expect(() => renderModal({ defaultValues: emptyDefaultValues })).not.toThrow();
  });

  it('initialise les champs à vide si defaultValues est vide', () => {
    mockValidateEmail.mockReturnValue("Email requis");
    renderModal({ defaultValues: emptyDefaultValues });
    expect(screen.getByPlaceholderText('exemple@client.fr')).toHaveValue('');
  });

  it("n'affiche pas d'alerte si l'email par défaut est valide", () => {
    renderModal();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("affiche une alerte si l'email par défaut est invalide", () => {
    mockValidateEmail.mockReturnValue("Adresse email invalide");
    renderModal({ defaultValues: { ...defaultValues, to: INVALID_EMAIL } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Adresse email invalide');
  });

  it("affiche une alerte si to est vide à l'ouverture", () => {
    mockValidateEmail.mockReturnValue("Email requis");
    renderModal({ defaultValues: emptyDefaultValues });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it("ne rend rien de visible si show=false", () => {
    mockValidateEmail.mockReturnValue(null);
    renderModal({ show: false });
    // Le Modal Bootstrap ne monte pas son contenu si show=false
    expect(screen.queryByText('Envoyer la facture par email')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Bouton Envoyer — état activé/désactivé
// ---------------------------------------------------------------------------

describe('EmailModal — bouton Envoyer', () => {
  afterEach(() => vi.clearAllMocks());

  it("est activé si l'email est valide", () => {
    mockValidateEmail.mockReturnValue(null);
    renderModal();
    expect(screen.getByText('Envoyer')).not.toBeDisabled();
  });

  it("est désactivé si l'email est invalide", () => {
    mockValidateEmail.mockReturnValue("Email invalide");
    renderModal({ defaultValues: { ...defaultValues, to: INVALID_EMAIL } });
    expect(screen.getByText('Envoyer')).toBeDisabled();
  });

  it("est désactivé si to est vide", () => {
    mockValidateEmail.mockReturnValue("Email requis");
    renderModal({ defaultValues: emptyDefaultValues });
    expect(screen.getByText('Envoyer')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 3. Soumission valide
// ---------------------------------------------------------------------------

describe('EmailModal — soumission valide', () => {
  afterEach(() => vi.clearAllMocks());

  it('appelle onSend avec to, subject, message', () => {
    mockValidateEmail.mockReturnValue(null);
    const onSend = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSend, onClose });

    fireEvent.click(screen.getByText('Envoyer'));

    expect(onSend).toHaveBeenCalledWith({
      to: VALID_EMAIL,
      subject: 'Facture',
      message: 'Voici votre facture',
    });
  });

  it('appelle onClose après onSend', () => {
    mockValidateEmail.mockReturnValue(null);
    const onSend = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSend, onClose });

    fireEvent.click(screen.getByText('Envoyer'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onSend si l'email est invalide", () => {
    mockValidateEmail.mockReturnValue("Email invalide");
    const onSend = vi.fn();
    renderModal({ onSend, defaultValues: { ...defaultValues, to: INVALID_EMAIL } });

    // Le bouton est disabled — on force via handleSubmit en cherchant le bouton
    // (le bouton est disabled donc fireEvent ne déclenche pas onClick, c'est le comportement attendu)
    fireEvent.click(screen.getByText('Envoyer'));
    expect(onSend).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Modification des champs
// ---------------------------------------------------------------------------

describe('EmailModal — modification des champs', () => {
  afterEach(() => vi.clearAllMocks());

  it('met à jour le champ subject', async () => {
    mockValidateEmail.mockReturnValue(null);
    renderModal();
    const input = screen.getByDisplayValue('Facture');
    await userEvent.clear(input);
    await userEvent.type(input, 'Nouveau sujet');
    expect(input).toHaveValue('Nouveau sujet');
  });

  it('met à jour le champ message', async () => {
    mockValidateEmail.mockReturnValue(null);
    renderModal();
    const textarea = screen.getByDisplayValue('Voici votre facture');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Nouveau message');
    expect(textarea).toHaveValue('Nouveau message');
  });
});

// ---------------------------------------------------------------------------
// 5. Réinitialisation via useEffect
// ---------------------------------------------------------------------------

describe('EmailModal — réinitialisation (useEffect)', () => {
  afterEach(() => vi.clearAllMocks());

  it('réinitialise les champs quand defaultValues change', async () => {
    mockValidateEmail.mockReturnValue(null);
    const { rerender } = renderModal();

    expect(screen.getByDisplayValue(VALID_EMAIL)).toBeInTheDocument();

    const newDefaults = { to: 'nouveau@test.com', subject: 'Nouveau', message: 'Msg' };
    mockValidateEmail.mockReturnValue(null);

    rerender(
      <EmailModal
        show={true}
        onSend={vi.fn()}
        onClose={vi.fn()}
        defaultValues={newDefaults}
      />
    );

    await waitFor(() =>
      expect(screen.getByDisplayValue('nouveau@test.com')).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue('Nouveau')).toBeInTheDocument();
  });

  it("réinitialise l'erreur quand show repasse à true", async () => {
    mockValidateEmail.mockReturnValue(null);
    const { rerender } = renderModal({ show: false });

    rerender(
      <EmailModal
        show={true}
        onSend={vi.fn()}
        onClose={vi.fn()}
        defaultValues={defaultValues}
      />
    );

    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Bouton Annuler
// ---------------------------------------------------------------------------

describe('EmailModal — bouton Annuler', () => {
  afterEach(() => vi.clearAllMocks());

  it('appelle onClose au clic sur Annuler', () => {
    mockValidateEmail.mockReturnValue(null);
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByText('Annuler'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onSend au clic sur Annuler", () => {
    mockValidateEmail.mockReturnValue(null);
    const onSend = vi.fn();
    renderModal({ onSend });
    fireEvent.click(screen.getByText('Annuler'));
    expect(onSend).not.toHaveBeenCalled();
  });
});