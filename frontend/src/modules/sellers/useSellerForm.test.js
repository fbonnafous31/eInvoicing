// frontend/src/modules/sellers/useSellerForm.test.jsx
import { renderHook, act } from '@testing-library/react';
import useSellerForm from './useSellerForm';

const mockCheckIdentifier = vi.fn();

vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    checkIdentifier: mockCheckIdentifier,
  }),
}));

vi.mock('../../utils/validators/seller', () => ({
  validateSeller: (data, field) => {
    const errors = {};
    if (field === 'contact_email' && !data.contact_email.includes('@')) {
      errors.contact_email = 'Email invalide';
    }
    return errors;
  },
}));

describe('useSellerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialise correctement le formulaire', () => {
    const { result } = renderHook(() => useSellerForm({ legal_name: 'Test SARL' }));

    expect(result.current.formData.legal_name).toBe('Test SARL');
    expect(result.current.formData.country_code).toBe('FR');
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.openSections).toEqual({
      legal: false,
      contact: false,
      address: false,
      finances: false,
      mentions: false,
      smtp: false,
    });
  });

  it('handleChange met à jour le champ et valide', () => {
    const { result } = renderHook(() => useSellerForm());

    act(() => result.current.handleChange('contact_email', 'wrongemail'));
    expect(result.current.formData.contact_email).toBe('wrongemail');
    expect(result.current.errors.contact_email).toBe('Email invalide');

    act(() => result.current.handleChange('contact_email', 'correct@email.com'));
    expect(result.current.formData.contact_email).toBe('correct@email.com');
    expect(result.current.errors.contact_email).toBe(undefined);
  });

  it('handleBlur met à jour touched et valide le champ', () => {
    const { result } = renderHook(() => useSellerForm());

    act(() => result.current.handleBlur('contact_email'));
    expect(result.current.touched.contact_email).toBe(true);
    expect(result.current.errors.contact_email).toBe('Email invalide');
  });

  it('toggleSection inverse l’état de la section', () => {
    const { result } = renderHook(() => useSellerForm());

    // Initialement fermé (false)
    act(() => result.current.toggleSection('contact'));
    expect(result.current.openSections.contact).toBe(true);

    act(() => result.current.toggleSection('contact'));
    expect(result.current.openSections.contact).toBe(false);
  });

  it('checkIdentifierAPI renvoie valid=false si l’identifiant existe', async () => {
    mockCheckIdentifier.mockResolvedValueOnce({ exists: true });
    const { result } = renderHook(() => useSellerForm({ id: 1 }));

    let response;
    await act(async () => {
      response = await result.current.checkIdentifierAPI('ID123');
    });

    expect(response.valid).toBe(false);
    expect(result.current.errors.legal_identifier).toBe('Cet identifiant est déjà utilisé');
    expect(mockCheckIdentifier).toHaveBeenCalledWith('ID123', 1);
  });

  it('checkIdentifierAPI renvoie valid=true si l’identifiant n’existe pas', async () => {
    mockCheckIdentifier.mockResolvedValueOnce({ exists: false });
    const { result } = renderHook(() => useSellerForm({ id: 1 }));

    let response;
    await act(async () => {
      response = await result.current.checkIdentifierAPI('ID123');
    });

    expect(response.valid).toBe(true);
    expect(result.current.errors.legal_identifier).toBe(undefined);
    expect(mockCheckIdentifier).toHaveBeenCalledWith('ID123', 1);
  });

  it('checkIdentifierAPI gère les erreurs du service', async () => {
    mockCheckIdentifier.mockRejectedValueOnce(new Error('Service down'));
    const { result } = renderHook(() => useSellerForm());

    let response;
    await act(async () => {
      response = await result.current.checkIdentifierAPI('ID123');
    });

    expect(response.valid).toBe(false);
    expect(result.current.errors.legal_identifier).toBe('Impossible de vérifier l’identifiant');
  });
});
