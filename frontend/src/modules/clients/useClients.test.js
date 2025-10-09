// frontend/src/hooks/useClients.test.jsx
import { renderHook, act } from '@testing-library/react';
import useClients from './useClients';

const mockFetchClients = vi.fn();

vi.mock('@/services/clients', () => ({
  useClientService: () => ({
    fetchClients: mockFetchClients,
  }),
}));

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialise correctement les états', () => {
    mockFetchClients.mockResolvedValue([]);
    const { result } = renderHook(() => useClients());

    expect(result.current.clients).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('charge les clients avec succès', async () => {
    const clientsData = [{ id: 1, legal_name: 'Client Test' }];
    mockFetchClients.mockResolvedValue(clientsData);

    let result;
    await act(async () => {
      result = renderHook(() => useClients()).result;
      await Promise.resolve(); // attendre le useEffect
    });

    expect(mockFetchClients).toHaveBeenCalled();
    expect(result.current.clients).toEqual(clientsData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('gère une erreur lors du chargement', async () => {
    mockFetchClients.mockRejectedValue(new Error('Network error'));

    let result;
    await act(async () => {
      result = renderHook(() => useClients()).result;
      await Promise.resolve();
    });

    expect(mockFetchClients).toHaveBeenCalled();
    expect(result.current.clients).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Erreur lors du chargement des clients');
  });
});
