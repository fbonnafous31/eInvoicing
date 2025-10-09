// frontend/src/modules/sellers/useSellers.test.jsx
import { renderHook, act } from '@testing-library/react';
import useSellers from './useSellers';

const mockFetchSellers = vi.fn();

vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    fetchSellers: mockFetchSellers,
  }),
}));

describe('useSellers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialise correctement les états', () => {
    mockFetchSellers.mockResolvedValue([]);
    const { result } = renderHook(() => useSellers());

    expect(result.current.sellers).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('charge les vendeurs avec succès', async () => {
    const sellersData = [{ id: 1, legal_name: 'SARL Test' }];
    mockFetchSellers.mockResolvedValue(sellersData);

    let result;
    await act(async () => {
      result = renderHook(() => useSellers()).result;
      // attendre le useEffect
      await Promise.resolve();
    });

    expect(mockFetchSellers).toHaveBeenCalled();
    expect(result.current.sellers).toEqual(sellersData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('gère une erreur lors du chargement', async () => {
    mockFetchSellers.mockRejectedValue(new Error('Network error'));

    let result;
    await act(async () => {
      result = renderHook(() => useSellers()).result;
      await Promise.resolve();
    });

    expect(mockFetchSellers).toHaveBeenCalled();
    expect(result.current.sellers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Erreur lors du chargement des vendeurs');
  });

  it('setSellers permet de mettre à jour les vendeurs manuellement', async () => {
    mockFetchSellers.mockResolvedValue([]);
    const { result } = renderHook(() => useSellers());

    act(() => result.current.setSellers([{ id: 2, legal_name: 'SARL Demo' }]));
    expect(result.current.sellers).toEqual([{ id: 2, legal_name: 'SARL Demo' }]);
  });
});
