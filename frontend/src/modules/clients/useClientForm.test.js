// frontend/src/hooks/useClientForm.test.jsx
import { renderHook, act } from '@testing-library/react';
import useClientForm from './useClientForm';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCheckSiret = vi.fn();

vi.mock('@/services/clients', () => ({
  useClientService: () => ({
    checkSiret: mockCheckSiret,
  }),
}));

vi.mock('../../utils/validators/client', () => ({
  validateClient: (data, field) => {
    const errors = {};
    if (field === 'email' && data.email && !data.email.includes('@')) {
      errors.email = 'Email invalide';
    }
    if (field === 'legal_name' && !data.legal_name) {
      errors.legal_name = 'Raison sociale requise';
    }
    if (field === 'siret' && data.siret && data.siret.replace(/\D/g, '').length !== 14) {
      errors.siret = 'SIRET invalide (14 chiffres requis)';
    }
    return errors;
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_SIRET = '73282932000074';
const SHORT_SIRET = '1234567890';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initialisation ────────────────────────────────────────────────────────

  describe('Initialisation', () => {
    it('applique les valeurs par défaut sans initialData', () => {
      const { result } = renderHook(() => useClientForm());
      expect(result.current.formData).toMatchObject({
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
      });
    });

    it('fusionne initialData par-dessus les valeurs par défaut', () => {
      const { result } = renderHook(() =>
        useClientForm({ legal_name: 'Test Inc.', country_code: 'DE' })
      );
      expect(result.current.formData.legal_name).toBe('Test Inc.');
      expect(result.current.formData.country_code).toBe('DE');
      // Les autres defaults restent intacts
      expect(result.current.formData.is_company).toBe(true);
      expect(result.current.formData.email).toBe('');
    });

    it('initialise errors, touched et openSections à leurs valeurs vides/ouvertes', () => {
      const { result } = renderHook(() => useClientForm());
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.openSections).toEqual({
        legal: true,
        contact: true,
        address: true,
        finances: true,
      });
    });

    it('expose bien toutes les fonctions et états attendus', () => {
      const { result } = renderHook(() => useClientForm());
      expect(typeof result.current.handleChange).toBe('function');
      expect(typeof result.current.handleBlur).toBe('function');
      expect(typeof result.current.toggleSection).toBe('function');
      expect(typeof result.current.checkSiretAPI).toBe('function');
      expect(typeof result.current.setFormData).toBe('function');
      expect(typeof result.current.setErrors).toBe('function');
      expect(typeof result.current.setTouched).toBe('function');
    });
  });

  // ── handleChange ──────────────────────────────────────────────────────────

  describe('handleChange', () => {
    it('met à jour le champ ciblé', async () => {
      const { result } = renderHook(() => useClientForm());
      await act(async () => {
        result.current.handleChange('city', 'Bordeaux');
      });
      expect(result.current.formData.city).toBe('Bordeaux');
    });

    it('ne modifie pas les autres champs lors de changement', async () => {
      const { result } = renderHook(() => useClientForm({ legal_name: 'Acme' }));
      await act(async () => {
        result.current.handleChange('city', 'Lyon');
      });
      expect(result.current.formData.legal_name).toBe('Acme');
    });

    it('valide le champ et stocke erreur si invalide', async () => {
      const { result } = renderHook(() => useClientForm());
      await act(async () => {
        result.current.handleChange('email', 'pas-un-email');
      });
      expect(result.current.errors.email).toBe('Email invalide');
    });

    it('efface erreur quand le champ devient valide', async () => {
      const { result } = renderHook(() => useClientForm());
      await act(async () => {
        result.current.handleChange('email', 'pas-un-email');
      });
      expect(result.current.errors.email).toBe('Email invalide');

      await act(async () => {
        result.current.handleChange('email', 'ok@example.com');
      });
      expect(result.current.errors.email).toBeUndefined();
    });

    it('ne touche pas erreur siret "déjà utilisé" lors un nouveau changement', async () => {
      mockCheckSiret.mockResolvedValue({ exists: true });
      const { result } = renderHook(() => useClientForm());

      // Déclenche l'erreur "déjà utilisé" via checkSiretAPI
      await act(async () => {
        await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(result.current.errors.siret).toBe('Ce SIRET est déjà utilisé par un autre client');

      // Un nouveau handleChange sur siret ne doit pas écraser ce message
      await act(async () => {
        result.current.handleChange('siret', VALID_SIRET);
      });
      expect(result.current.errors.siret).toBe('Ce SIRET est déjà utilisé par un autre client');
    });

    it('déclenche checkSiretAPI automatiquement quand siret atteint 14 chiffres', async () => {
      mockCheckSiret.mockResolvedValue({ exists: false });
      const { result } = renderHook(() => useClientForm());

      await act(async () => {
        result.current.handleChange('siret', VALID_SIRET);
      });

      expect(mockCheckSiret).toHaveBeenCalledWith(VALID_SIRET, undefined);
    });

    it('ne déclenche pas checkSiretAPI si siret a moins de 14 chiffres', async () => {
      const { result } = renderHook(() => useClientForm());
      await act(async () => {
        result.current.handleChange('siret', SHORT_SIRET);
      });
      expect(mockCheckSiret).not.toHaveBeenCalled();
    });

    it('ignore les caractères non-numériques pour le comptage des 14 chiffres du siret', async () => {
      mockCheckSiret.mockResolvedValue({ exists: false });
      const { result } = renderHook(() => useClientForm());

      // SIRET avec espaces → 14 chiffres nets
      await act(async () => {
        result.current.handleChange('siret', '732 829 320 00074');
      });
      expect(mockCheckSiret).toHaveBeenCalledWith(VALID_SIRET, undefined);
    });
  });

  // ── handleBlur ────────────────────────────────────────────────────────────

  describe('handleBlur', () => {
    it('marque le champ comme touché', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => {
        result.current.handleBlur('legal_name');
      });
      expect(result.current.touched.legal_name).toBe(true);
    });

    it('ne réinitialise pas les autres champs touchés', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => result.current.handleBlur('email'));
      act(() => result.current.handleBlur('city'));
      expect(result.current.touched.email).toBe(true);
      expect(result.current.touched.city).toBe(true);
    });

    it('valide et stocke erreur au blur', () => {
      const { result } = renderHook(() => useClientForm({ legal_name: '' }));
      act(() => {
        result.current.handleBlur('legal_name');
      });
      expect(result.current.errors.legal_name).toBe('Raison sociale requise');
    });

    it('ne touche pas erreur siret "déjà utilisé" au blur', async () => {
      mockCheckSiret.mockResolvedValue({ exists: true });
      const { result } = renderHook(() => useClientForm({ siret: VALID_SIRET }));

      await act(async () => {
        await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(result.current.errors.siret).toBe('Ce SIRET est déjà utilisé par un autre client');

      act(() => {
        result.current.handleBlur('siret');
      });
      // L'erreur "déjà utilisé" est préservée
      expect(result.current.errors.siret).toBe('Ce SIRET est déjà utilisé par un autre client');
    });

    it('déclenche checkSiretAPI au blur si siret a 14 chiffres', async () => {
      mockCheckSiret.mockResolvedValue({ exists: false });
      const { result } = renderHook(() => useClientForm({ siret: VALID_SIRET }));

      await act(async () => {
        result.current.handleBlur('siret');
      });
      expect(mockCheckSiret).toHaveBeenCalledWith(VALID_SIRET, undefined);
    });

    it('ne déclenche pas checkSiretAPI au blur si siret incomplet', async () => {
      const { result } = renderHook(() => useClientForm({ siret: SHORT_SIRET }));
      await act(async () => {
        result.current.handleBlur('siret');
      });
      expect(mockCheckSiret).not.toHaveBeenCalled();
    });
  });

  // ── checkSiretAPI ─────────────────────────────────────────────────────────

  describe('checkSiretAPI', () => {
    it('renvoie { valid: true } sans appel API si siret vide', async () => {
      const { result } = renderHook(() => useClientForm());
      let response;
      await act(async () => {
        response = await result.current.checkSiretAPI('');
      });
      expect(response).toEqual({ valid: true });
      expect(mockCheckSiret).not.toHaveBeenCalled();
    });

    it('renvoie { valid: true } sans appel API si siret a moins de 14 caractères', async () => {
      const { result } = renderHook(() => useClientForm());
      let response;
      await act(async () => {
        response = await result.current.checkSiretAPI(SHORT_SIRET);
      });
      expect(response).toEqual({ valid: true });
      expect(mockCheckSiret).not.toHaveBeenCalled();
    });

    it('passe undefined comme deuxième arg si formData.id est absent', async () => {
      mockCheckSiret.mockResolvedValue({ exists: false });
      const { result } = renderHook(() => useClientForm());
      await act(async () => {
        await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(mockCheckSiret).toHaveBeenCalledWith(VALID_SIRET, undefined);
    });

    it('passe id comme deuxième arg si formData.id est défini', async () => {
      mockCheckSiret.mockResolvedValue({ exists: false });
      const { result } = renderHook(() => useClientForm({ id: 7 }));
      await act(async () => {
        await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(mockCheckSiret).toHaveBeenCalledWith(VALID_SIRET, 7);
    });

    it('renvoie valid=false et pose erreur si SIRET déjà utilisé', async () => {
      mockCheckSiret.mockResolvedValue({ exists: true });
      const { result } = renderHook(() => useClientForm({ id: 1 }));
      let response;
      await act(async () => {
        response = await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(response.valid).toBe(false);
      expect(result.current.errors.siret).toBe('Ce SIRET est déjà utilisé par un autre client');
    });

    it('renvoie valid=true et efface erreur si SIRET libre', async () => {
      mockCheckSiret.mockResolvedValue({ exists: false });
      const { result } = renderHook(() => useClientForm({ id: 1 }));
      // Pose une erreur préalable pour vérifier qu'elle est bien effacée
      act(() => {
        result.current.setErrors({ siret: 'Ce SIRET est déjà utilisé par un autre client' });
      });
      let response;
      await act(async () => {
        response = await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(response.valid).toBe(true);
      expect(result.current.errors.siret).toBeUndefined();
    });

    it('renvoie valid=false et pose erreur générique si API plante', async () => {
      mockCheckSiret.mockRejectedValue(new Error('timeout'));
      const { result } = renderHook(() => useClientForm());
      let response;
      await act(async () => {
        response = await result.current.checkSiretAPI(VALID_SIRET);
      });
      expect(response.valid).toBe(false);
      expect(result.current.errors.siret).toBe('Impossible de vérifier le SIRET');
    });
  });

  // ── toggleSection ─────────────────────────────────────────────────────────

  describe('toggleSection', () => {
    it('ferme une section ouverte', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => result.current.toggleSection('legal'));
      expect(result.current.openSections.legal).toBe(false);
    });

    it('rouvre une section fermée', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => result.current.toggleSection('legal'));
      act(() => result.current.toggleSection('legal'));
      expect(result.current.openSections.legal).toBe(true);
    });

    it('ne modifie pas les autres sections lors du toggle', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => result.current.toggleSection('contact'));
      expect(result.current.openSections.legal).toBe(true);
      expect(result.current.openSections.address).toBe(true);
      expect(result.current.openSections.finances).toBe(true);
    });

    it('peut toggler toutes les sections indépendamment', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => {
        result.current.toggleSection('legal');
        result.current.toggleSection('contact');
        result.current.toggleSection('address');
        result.current.toggleSection('finances');
      });
      expect(result.current.openSections).toEqual({
        legal: false,
        contact: false,
        address: false,
        finances: false,
      });
    });
  });

  // ── setFormData / setErrors / setTouched (API publique) ───────────────────

  describe('API publique setFormData / setErrors / setTouched', () => {
    it('setFormData remplace entièrement formData', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => {
        result.current.setFormData((prev) => ({ ...prev, city: 'Nantes' }));
      });
      expect(result.current.formData.city).toBe('Nantes');
    });

    it('setErrors permet de poser des erreurs externes', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => {
        result.current.setErrors({ legal_name: 'Erreur externe' });
      });
      expect(result.current.errors.legal_name).toBe('Erreur externe');
    });

    it('setTouched permet de marquer des champs comme touchés en dehors du blur', () => {
      const { result } = renderHook(() => useClientForm());
      act(() => {
        result.current.setTouched({ email: true, city: true });
      });
      expect(result.current.touched.email).toBe(true);
      expect(result.current.touched.city).toBe(true);
    });
  });
});