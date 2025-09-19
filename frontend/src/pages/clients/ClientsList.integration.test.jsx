import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import ClientsList from '@/pages/clients/ClientsList';
import useClients from '@/modules/clients/useClients';

vi.mock('@/modules/clients/useClients', () => ({ default: vi.fn() }));
vi.mock('@/modules/clients/clientColumns', () => ({ default: vi.fn(() => []) }));
vi.mock('react-data-table-component', () => ({
  default: (props) => <div>{props.progressPending ? 'Loading...' : props.data.map(c => c.name).join(', ')}</div>,
}));
vi.mock('@/components/layout/Breadcrumb', () => ({ default: ({ items }) => <nav>{items.map(i => i.label).join(' > ')}</nav> }));
vi.mock('@/components/common/AuditPanel', () => ({ default: () => <div>AuditPanel</div> }));

describe('ClientsList complet', () => {
  it('affiche le loader quand loading = true', () => {
    useClients.mockReturnValue({ clients: [], loading: true, error: null });
    render(<ClientsList />);
    /* eslint-disable-next-line no-undef */
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('affiche la table quand loading = false', () => {
    useClients.mockReturnValue({ clients: [{ id: 1, name: 'Test Client' }], loading: false, error: null });
    render(<ClientsList />);
    /* eslint-disable-next-line no-undef */
    expect(screen.getByText(/Test Client/i)).toBeInTheDocument();
  });

  it('affiche un message d’erreur', () => {
    useClients.mockReturnValue({ clients: [], loading: false, error: 'Erreur !' });
    render(<ClientsList />);
    /* eslint-disable-next-line no-undef */
    expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
  });

  it('filtre les clients via l’input', () => {
    useClients.mockReturnValue({
      clients: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      loading: false,
      error: null,
    });

    render(<ClientsList />);

    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: 'Alice' } });

    /* eslint-disable-next-line no-undef */
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();

    /* eslint-disable-next-line no-undef */
    expect(screen.queryByText(/Bob/i)).not.toBeInTheDocument();
  });
});
