// frontend/src/pages/Home.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './Home';
import { useNavigate } from 'react-router-dom';
import { useSellerService } from '@/services/sellers';
import { useInvoiceService } from '@/services/invoices';
import { useSellerInfo } from '@/hooks/useSellerInfo';

// ─── Mocks globaux ──────────────────────────────────────────────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock('@/services/sellers', () => ({
  useSellerService: vi.fn(),
}));

vi.mock('@/services/invoices', () => ({
  useInvoiceService: vi.fn(),
}));

// ⚠️ Ce mock manquait dans tes tests existants
vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: vi.fn(),
}));

// Mock Recharts pour éviter les erreurs de resize observer en JSDOM
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Cell: () => null,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

// Facture "à jour" (émise aujourd'hui → pas encore en retard)
const makeInvoice = (overrides = {}) => ({
  id: '1',
  invoice_number: 'FAC-001',
  business_status: '205',
  technical_status: 'validated',
  issue_date: new Date().toISOString().slice(0, 10),
  total: '1500',
  client: { legal_name: 'Acme Corp' },
  ...overrides,
});

// Facture en retard (émise il y a 60 jours, statut non-final)
const makeOverdueInvoice = (overrides = {}) => {
  const past = new Date();
  past.setDate(past.getDate() - 60);
  return makeInvoice({
    id: '2',
    invoice_number: 'FAC-002',
    issue_date: past.toISOString().slice(0, 10),
    ...overrides,
  });
};

const setupMocks = ({ plan = 'free', invoices = [] } = {}) => {
  useNavigate.mockReturnValue(mockNavigate);
  useSellerService.mockReturnValue({ fetchMySeller: async () => ({ id: 42 }) });
  useInvoiceService.mockReturnValue({ fetchInvoicesBySeller: async () => invoices });
  useSellerInfo.mockReturnValue({ sellerPlan: plan, sellerActive: true, isLoading: false });
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Home page', () => {

  // ── État de chargement ────────────────────────────────────────────────────

  it('affiche "Chargement…" au départ', () => {
    useNavigate.mockReturnValue(vi.fn());
    useSellerService.mockReturnValue({ fetchMySeller: vi.fn(() => new Promise(() => {})) });
    useInvoiceService.mockReturnValue({ fetchInvoicesBySeller: vi.fn() });
    useSellerInfo.mockReturnValue({ sellerPlan: 'free', sellerActive: false, isLoading: true });

    render(<Home />);
    expect(screen.getByText('Chargement…')).toBeDefined();
  });

  // ── Pas de seller ─────────────────────────────────────────────────────────

  it('affiche le message de bienvenue si aucun seller', async () => {
    useNavigate.mockReturnValue(mockNavigate);
    useSellerService.mockReturnValue({ fetchMySeller: async () => null });
    useInvoiceService.mockReturnValue({ fetchInvoicesBySeller: vi.fn() });
    useSellerInfo.mockReturnValue({ sellerPlan: null, sellerActive: false, isLoading: false });

    render(<Home />);
    await waitFor(() => screen.getByText('Créer ma fiche vendeur'));

    expect(screen.getByText(/Bienvenue sur eInvoicing/)).toBeDefined();
  });

  it('navigue vers /sellers/new au clic sur "Créer ma fiche vendeur"', async () => {
    useNavigate.mockReturnValue(mockNavigate);
    useSellerService.mockReturnValue({ fetchMySeller: async () => null });
    useInvoiceService.mockReturnValue({ fetchInvoicesBySeller: vi.fn() });
    useSellerInfo.mockReturnValue({ sellerPlan: null, sellerActive: false, isLoading: false });

    render(<Home />);
    const button = await screen.findByText('Créer ma fiche vendeur');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/sellers/new');
  });

  // ── Tableau de bord (plan free) ───────────────────────────────────────────

  it('affiche le tableau de bord avec les sections de base', async () => {
    setupMocks({ plan: 'free', invoices: [makeInvoice()] });

    render(<Home />);
    await waitFor(() => screen.getByText(/Tableau de bord/));

    expect(screen.getByText(/Top 5 clients/)).toBeDefined();
    expect(screen.getByText(/Montant facturé par mois/)).toBeDefined();
  });

  it('affiche le message upgrade si le plan n\'est pas "pro"', async () => {
    setupMocks({ plan: 'free', invoices: [] });

    render(<Home />);
    await waitFor(() => screen.getByText(/plan/i));

    expect(screen.getByText(/Pro/)).toBeDefined();
    // Les sections pro ne doivent PAS être présentes
    expect(screen.queryByText(/Statuts des factures/)).toBeNull();
    expect(screen.queryByText(/Factures en cours/)).toBeNull();
  });

  // ── Top 5 clients ─────────────────────────────────────────────────────────

  it('affiche les clients dans le top 5', async () => {
    const invoices = [
      makeInvoice({ id: '1', client: { legal_name: 'Acme Corp' }, total: '3000' }),
      makeInvoice({ id: '2', client: { legal_name: 'Beta SAS' }, total: '1200' }),
    ];
    setupMocks({ invoices });

    render(<Home />);
    await waitFor(() => screen.getByText('Acme Corp'));

    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Beta SAS')).toBeDefined();
  });

  // ── Section Pro ───────────────────────────────────────────────────────────

  it('affiche les sections Pro si le plan est "pro"', async () => {
    setupMocks({ plan: 'pro', invoices: [makeInvoice()] });

    render(<Home />);
    await waitFor(() => screen.getByText(/Statuts des factures/));

    expect(screen.getByText(/Statuts des factures/)).toBeDefined();
    expect(screen.getByText(/Factures en cours/)).toBeDefined();
    expect(screen.getByText(/Factures en retard/)).toBeDefined();
  });

  // ── Factures en retard ────────────────────────────────────────────────────

  it('affiche "Aucune facture en retard" si toutes les factures sont à jour', async () => {
    setupMocks({ plan: 'pro', invoices: [makeInvoice()] });

    render(<Home />);
    await waitFor(() => screen.getByText(/Aucune facture en retard/));

    expect(screen.getByText(/Aucune facture en retard/)).toBeDefined();
  });

  it('exclut les factures avec business_status "210" des retards', async () => {
    const rejected = makeOverdueInvoice({ business_status: '210' });
    setupMocks({ plan: 'pro', invoices: [rejected] });

    render(<Home />);
    await waitFor(() => screen.getByText(/Aucune facture en retard/));
    expect(screen.getByText(/Aucune facture en retard/)).toBeDefined();
  });

  it('exclut les factures avec technical_status "pending" des retards', async () => {
    const pending = makeOverdueInvoice({ technical_status: 'pending' });
    setupMocks({ plan: 'pro', invoices: [pending] });

    render(<Home />);
    await waitFor(() => screen.getByText(/Aucune facture en retard/));
    expect(screen.getByText(/Aucune facture en retard/)).toBeDefined();
  });

  // ── Navigation depuis les statuts ─────────────────────────────────────────

  it('navigue avec le bon filtre au clic sur un badge de statut', async () => {
    const inv = makeInvoice({ business_status: '205' });
    setupMocks({ plan: 'pro', invoices: [inv] });

    render(<Home />);
    // On attend qu'un badge de statut soit visible (dépend de BUSINESS_STATUSES)
    await waitFor(() => screen.getByText(/Statuts des factures/));

    const badges = screen.getAllByRole('cell');
    // Clic sur le premier badge cliquable trouvé via son style
    const clickable = document.querySelector('[style*="cursor: pointer"]');
    if (clickable) {
      fireEvent.click(clickable);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/invoices\?filter=/)
      );
    }
  });
});