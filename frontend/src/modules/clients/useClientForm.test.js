// frontend/src/hooks/useClientForm.test.jsx
import { renderHook, act } from '@testing-library/react';
import useClientForm from './useClientForm';

// 🔹 Mock du service client
const mockCheckSiret = vi.fn();

vi.mock('@/services/clients', () => ({
  useClientService: () => ({
    checkSiret: mockCheckSiret,
  }),
}));

vi.mock('../../utils/validators/client', () => ({
  validateClient: (data, field) => {
    const errors = {};
    if (field === 'email' && !data.email.includes('@')) {
      errors.email = 'Email invalide';
    }
    return errors;
  },
}));

describe('useClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialise correctement le formulaire', () => {
    const { result } = renderHook(() => useClientForm({ legal_name: 'Test Inc.' }));

    expect(result.current.formData.legal_name).toBe('Test Inc.');
    expect(result.current.formData.country_code).toBe('FR');
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.openSections).toEqual({
      legal: true,
      contact: true,
      address: true,
      finances: true,
    });
  });

  it('handleChange met à jour le champ et valide', async () => {
    const { result } = renderHook(() => useClientForm());

    await act(async () => {
      result.current.handleChange('email', 'wrongemail');
    });

    expect(result.current.formData.email).toBe('wrongemail');
    expect(result.current.errors.email).toBe('Email invalide');

    await act(async () => {
      result.current.handleChange('email', 'correct@email.com');
    });

    expect(result.current.formData.email).toBe('correct@email.com');
    expect(result.current.errors.email).toBe(undefined);
  });

  it('toggleSection inverse l’état de la section', () => {
    const { result } = renderHook(() => useClientForm());

    act(() => result.current.toggleSection('contact'));
    expect(result.current.openSections.contact).toBe(false);

    act(() => result.current.toggleSection('contact'));
    expect(result.current.openSections.contact).toBe(true);
  });

  it('checkSiretAPI renvoie valid=false si le SIRET existe', async () => {
    mockCheckSiret.mockResolvedValueOnce({ exists: true });
    const { result } = renderHook(() => useClientForm({ id: 1 }));

    let response;
    await act(async () => {
      response = await result.current.checkSiretAPI('12345678901234');
    });

    expect(response.valid).toBe(false);
    expect(result.current.errors.siret).toBe('Ce SIRET est déjà utilisé par un autre client');
    expect(mockCheckSiret).toHaveBeenCalledWith('12345678901234', 1);
  });

  it('checkSiretAPI renvoie valid=true si le SIRET n’existe pas', async () => {
    mockCheckSiret.mockResolvedValueOnce({ exists: false });
    const { result } = renderHook(() => useClientForm({ id: 1 }));

    let response;
    await act(async () => {
      response = await result.current.checkSiretAPI('12345678901234');
    });

    expect(response.valid).toBe(true);
    expect(result.current.errors.siret).toBe(undefined);
    expect(mockCheckSiret).toHaveBeenCalledWith('12345678901234', 1);
  });

  it('checkSiretAPI gère les erreurs du service', async () => {
    mockCheckSiret.mockRejectedValueOnce(new Error('Service down'));
    const { result } = renderHook(() => useClientForm());

    let response;
    await act(async () => {
      response = await result.current.checkSiretAPI('12345678901234');
    });

    expect(response.valid).toBe(false);
    expect(result.current.errors.siret).toBe('Impossible de vérifier le SIRET');
  });
});
