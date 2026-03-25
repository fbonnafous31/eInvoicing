import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import NewClient from './NewClient';

// Mocks
const mockNavigate = vi.fn();
const mockCreateClient = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/services/clients', () => ({
  useClientService: () => ({
    createClient: mockCreateClient,
  }),
}));

// Mock du formulaire pour contrôler le submit
vi.mock('../clients/ClientForm', () => ({
  default: ({ onSubmit, disabled }) => (
    <button onClick={() => onSubmit({ name: 'Test' })} disabled={disabled}>
      Submit
    </button>
  ),
}));

vi.mock('../../components/layout/Breadcrumb', () => ({
  default: () => <div>Breadcrumb</div>,
}));

describe('NewClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le formulaire et le breadcrumb', () => {
    render(<NewClient />);

    expect(screen.getByText('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('crée un client avec succès', async () => {
    mockCreateClient.mockResolvedValueOnce({});

    render(<NewClient />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockCreateClient).toHaveBeenCalledWith({ name: 'Test' });

    await waitFor(() => {
      expect(screen.getByText(/client créé avec succès/i)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si createClient échoue', async () => {
    mockCreateClient.mockRejectedValueOnce(new Error('Erreur API'));

    render(<NewClient />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur API')).toBeInTheDocument();
    });
  });

  it('désactive le bouton pendant la soumission', async () => {
    let resolvePromise;
    mockCreateClient.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<NewClient />);

    const button = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();

    resolvePromise();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});