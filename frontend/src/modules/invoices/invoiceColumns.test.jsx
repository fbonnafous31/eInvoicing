import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import invoiceColumns from './invoiceColumns.jsx';

// ---------------------------------------------------------------------------
// Mocks des dépendances externes
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockSendInvoiceMail = vi.fn();
const mockGetInvoicePdfA3Proxy = vi.fn();
vi.mock('../../services/invoices', () => ({
  useInvoiceService: () => ({
    sendInvoiceMail: mockSendInvoiceMail,
    getInvoicePdfA3Proxy: mockGetInvoicePdfA3Proxy,
    API_ROOT: 'http://localhost:3000',
  }),
}));

vi.mock('../../utils/downloadFile', () => ({
  downloadFile: vi.fn(),
}));

vi.mock('../../utils/businessRules/invoiceStatus', () => ({
  canSendInvoice: vi.fn(),
}));

const mockGetToken = vi.fn().mockResolvedValue('fake-token');
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

// Valeurs par défaut — surchargées dans les tests ciblés
let mockSellerPlan = 'premium';
let mockSellerActive = true;
let mockIsLoading = false;

vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: () => ({
    get sellerPlan() { return mockSellerPlan; },
    get sellerActive() { return mockSellerActive; },
    get isLoading() { return mockIsLoading; },
  }),
}));

// Stubs des composants enfants (on ne teste pas leur rendu interne)
vi.mock('../../components/common/EllipsisCell', () => ({
  default: ({ value }) => <span data-testid="ellipsis-cell">{value}</span>,
}));
vi.mock('./TechnicalStatusCell', () => ({
  default: ({ row }) => <span data-testid="technical-status-cell">{row.technical_status}</span>,
}));
vi.mock('./BusinessStatusCell', () => ({
  default: ({ row }) => <span data-testid="business-status-cell">{row.business_status}</span>,
}));
vi.mock('../../components/invoices/InvoiceEmailButton', () => ({
  default: ({ row }) => <button data-testid="email-button">Mail {row.id}</button>,
}));
vi.mock('../../components/invoices/InvoiceTypeTag', () => ({
  default: ({ type, status }) => <span data-testid="invoice-type-tag">{type}-{status}</span>,
}));

vi.mock('../../utils/formatters/formatters', () => ({
  formatCurrency: (v) => `${v} €`,
  formatDate: (v) => `DATE(${v})`,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** invoiceService mock de base — toutes les méthodes sont des vi.fn() */
function makeInvoiceService(overrides = {}) {
  return {
    getInvoiceStatus: vi.fn(),
    downloadInvoicePdf: vi.fn().mockResolvedValue(undefined),
    sendInvoice: vi.fn(),
    fetchInvoice: vi.fn(),
    refreshInvoiceLifecycle: vi.fn(),
    cashInvoice: vi.fn(),
    getInvoiceStatusComment: vi.fn(),
    ...overrides,
  };
}

/** Facture de base valide */
function makeRow(overrides = {}) {
  return {
    id: 'inv-1',
    invoice_number: 'F-2024-001',
    invoice_type: 'standard',
    status: 'active',
    technical_status: 'draft',
    business_status: '200',
    subtotal: 1000,
    total_taxes: 200,
    total: 1200,
    issue_date: '2024-01-01',
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
    client: { legal_name: 'ACME Corp' },
    submission_id: 'sub-42',
    lifecycle: [],
    ...overrides,
  };
}

/** Lance le hook et renvoie les colonnes */
function getColumns(invoiceService, callbacks = {}) {
  const { result } = renderHook(() =>
    invoiceColumns(
      invoiceService,
      callbacks.onTechnicalStatusChange ?? vi.fn(),
      callbacks.onBusinessStatusChange ?? vi.fn(),
      callbacks.onInvoiceUpdate ?? vi.fn(),
    )
  );
  return result.current;
}

/** Trouve une colonne par son nom */
function col(columns, name) {
  return columns.find((c) => c.name === name);
}

/** Rend la cellule d'une colonne pour une row donnée */
function renderCell(column, row) {
  return render(<div>{column.cell(row)}</div>);
}

// ---------------------------------------------------------------------------
// 1. Filtrage des colonnes selon sellerPlan
// ---------------------------------------------------------------------------

describe('invoiceColumns — filtrage selon sellerPlan', () => {
  it('retourne toutes les colonnes pour le plan "premium"', () => {
    mockSellerPlan = 'premium';
    const columns = getColumns(makeInvoiceService());
    const names = columns.map((c) => c.name);
    expect(names).toContain('Envoyer / Statut');
    expect(names).toContain('Statut facture');
    expect(names).toContain('Statut PDP');
  });

  it('masque les colonnes sensibles pour le plan "essentiel"', () => {
    mockSellerPlan = 'essentiel';
    const columns = getColumns(makeInvoiceService());
    const names = columns.map((c) => c.name);
    expect(names).not.toContain('Envoyer / Statut');
    expect(names).not.toContain('Statut facture');
    expect(names).not.toContain('Statut PDP');
  });

  it('conserve les colonnes non filtrées pour le plan "essentiel"', () => {
    mockSellerPlan = 'essentiel';
    const columns = getColumns(makeInvoiceService());
    const names = columns.map((c) => c.name);
    expect(names).toContain('Actions');
    expect(names).toContain('Référence');
    expect(names).toContain('Client');
  });

  afterEach(() => {
    mockSellerPlan = 'premium';
  });
});

// ---------------------------------------------------------------------------
// 2. Colonne Actions — boutons naviguer / désactiver
// ---------------------------------------------------------------------------

describe('invoiceColumns — colonne Actions', () => {
  beforeEach(() => {
    mockSellerPlan = 'premium';
    mockSellerActive = true;
    mockNavigate.mockReset();
  });

  it('navigue vers la vue détail au clic sur 👁️', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow());
    fireEvent.click(screen.getByTitle('Consulter la facture'));
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/inv-1/view');
  });

  it("navigue vers l'édition au clic sur ✏️ (statut draft)", () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow({ technical_status: 'draft' }));
    fireEvent.click(screen.getByTitle('Modifier la facture'));
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/inv-1');
  });

  it('désactive ✏️ si la facture est annulée', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow({ status: 'cancelled' }));
    expect(screen.getByTitle('Modifier la facture')).toBeDisabled();
  });

  it('désactive ✏️ si statut technique est "validated" et métier != "208"', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow({ technical_status: 'validated', business_status: '200' }));
    expect(screen.getByTitle('Modifier la facture')).toBeDisabled();
  });

  it('active ✏️ si statut technique est "validated" mais métier == "208"', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow({ technical_status: 'validated', business_status: '208' }));
    expect(screen.getByTitle('Modifier la facture')).not.toBeDisabled();
  });

  it('télécharge le PDF au clic sur 📄', async () => {
    const service = makeInvoiceService();
    const columns = getColumns(service);
    renderCell(col(columns, 'Actions'), makeRow());
    fireEvent.click(screen.getByTitle('Télécharger le devis'));
    await waitFor(() =>
      expect(service.downloadInvoicePdf).toHaveBeenCalledWith(expect.objectContaining({ id: 'inv-1' }))
    );
  });

  it('affiche le bouton email si sellerActive est true', () => {
    mockSellerActive = true;
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow());
    expect(screen.getByTestId('email-button')).toBeInTheDocument();
  });

  it('masque le bouton email si sellerActive est false', () => {
    mockSellerActive = false;
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Actions'), makeRow());
    expect(screen.queryByTestId('email-button')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Colonne "Envoyer / Statut" — envoi, polling, encaissement
// ---------------------------------------------------------------------------

describe('invoiceColumns — colonne Envoyer / Statut', () => {
  beforeEach(() => {
    mockSellerPlan = 'premium';
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Bouton envoi 📧 ----

  it('désactive 📧 si canSendInvoice retourne false', async () => {
    const { canSendInvoice } = await import('../../utils/businessRules/invoiceStatus');
    canSendInvoice.mockReturnValue(false);

    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Envoyer / Statut'), makeRow());
    expect(screen.getByTitle(/Action impossible/)).toBeDisabled();
  });

  it('envoie la facture et poll le statut technique', async () => {
    const { canSendInvoice } = await import('../../utils/businessRules/invoiceStatus');
    canSendInvoice.mockReturnValue(true);

    const onTechnicalStatusChange = vi.fn();
    const onBusinessStatusChange = vi.fn();

    const service = makeInvoiceService({
      sendInvoice: vi.fn().mockResolvedValue({ submissionId: 'sub-99' }),
      getInvoiceStatus: vi.fn().mockResolvedValue({ technicalStatus: 'validated' }),
      fetchInvoice: vi.fn().mockResolvedValue({ business_status: '205', business_status_label: 'En attente' }),
    });

    const columns = getColumns(service, { onTechnicalStatusChange, onBusinessStatusChange });
    renderCell(col(columns, 'Envoyer / Statut'), makeRow({ technical_status: 'draft' }));

    fireEvent.click(screen.getByTitle('Envoyer la facture'));

    await waitFor(() => expect(onTechnicalStatusChange).toHaveBeenCalledWith('inv-1', 'validated'));
    await waitFor(() => expect(onBusinessStatusChange).toHaveBeenCalledWith('inv-1', '205', 'En attente'));
  });

  it('alerte si sendInvoice ne retourne pas de submissionId', async () => {
    const { canSendInvoice } = await import('../../utils/businessRules/invoiceStatus');
    canSendInvoice.mockReturnValue(true);

    const service = makeInvoiceService({
      sendInvoice: vi.fn().mockResolvedValue({}), // pas de submissionId
    });

    const columns = getColumns(service);
    renderCell(col(columns, 'Envoyer / Statut'), makeRow());
    fireEvent.click(screen.getByTitle('Envoyer la facture'));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringMatching(/statut technique ne peut pas être suivi/)
      )
    );
  });

  // ---- Bouton encaissement 💰 ----

  it('appelle cashInvoice et met à jour le statut métier', async () => {
    const onBusinessStatusChange = vi.fn();
    const service = makeInvoiceService({
      cashInvoice: vi.fn().mockResolvedValue({ newStatus: { code: '212', label: 'Encaissée' } }),
    });

    const columns = getColumns(service, { onBusinessStatusChange });
    renderCell(col(columns, 'Envoyer / Statut'), makeRow({ technical_status: 'validated', business_status: '205' }));

    fireEvent.click(screen.getByTitle('Encaisser la facture'));

    await waitFor(() => expect(onBusinessStatusChange).toHaveBeenCalledWith('inv-1', '212', 'Encaissée'));
    expect(window.alert).toHaveBeenCalledWith('Encaissement effectué !');
  });

  it("désactive 💰 si statut technique n'est pas received/validated", () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Envoyer / Statut'), makeRow({ technical_status: 'draft', business_status: '200' }));
    expect(screen.getByTitle(/Encaissement possible/)).toBeDisabled();
  });

  it('désactive 💰 si business_status est "210"', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Envoyer / Statut'), makeRow({ technical_status: 'validated', business_status: '210' }));
    expect(screen.getByTitle(/Encaissement possible/)).toBeDisabled();
  });

  // ---- Bouton rafraîchissement 🔄 ----

  it('rafraîchit le cycle métier et met à jour le statut', async () => {
    const onBusinessStatusChange = vi.fn();
    const onInvoiceUpdate = vi.fn();

    const service = makeInvoiceService({
      refreshInvoiceLifecycle: vi.fn().mockResolvedValue({ lastStatus: [] }),
      fetchInvoice: vi.fn().mockResolvedValue({
        business_status: '206',
        lifecycle: [{ code: '206', label: 'En litige' }],
      }),
    });

    const columns = getColumns(service, { onBusinessStatusChange, onInvoiceUpdate });
    renderCell(col(columns, 'Envoyer / Statut'), makeRow({ technical_status: 'validated', business_status: '205' }));

    fireEvent.click(screen.getByTitle('Rafraîchir le cycle de vie métier'));

    await waitFor(() =>
      expect(onBusinessStatusChange).toHaveBeenCalledWith('inv-1', '206', 'En litige')
    );
    await waitFor(() => expect(onInvoiceUpdate).toHaveBeenCalled());
  });

  it('affiche le message de rejet si présent', async () => {
    const service = makeInvoiceService({
      refreshInvoiceLifecycle: vi.fn().mockResolvedValue({
        lastStatus: [{ rejectionMessage: 'Facture non conforme' }],
      }),
      fetchInvoice: vi.fn().mockResolvedValue({ business_status: '209', lifecycle: [] }),
    });

    const columns = getColumns(service);
    renderCell(col(columns, 'Envoyer / Statut'), makeRow({ technical_status: 'validated', business_status: '205' }));
    fireEvent.click(screen.getByTitle('Rafraîchir le cycle de vie métier'));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Facture non conforme/))
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Rendu des cellules de données
// ---------------------------------------------------------------------------

describe('invoiceColumns — rendu des cellules', () => {
  beforeEach(() => {
    mockSellerPlan = 'premium';
  });

  it('affiche le type de facture via InvoiceTypeTag', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Type'), makeRow({ invoice_type: 'avoir', status: 'active' }));
    expect(screen.getByTestId('invoice-type-tag')).toHaveTextContent('avoir-active');
  });

  it('affiche le numéro de facture dans EllipsisCell', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Référence'), makeRow());
    expect(screen.getByTestId('ellipsis-cell')).toHaveTextContent('F-2024-001');
  });

  it('affiche le nom du client dans EllipsisCell', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Client'), makeRow());
    expect(screen.getByTestId('ellipsis-cell')).toHaveTextContent('ACME Corp');
  });

  it('affiche le statut technique via TechnicalStatusCell', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Statut PDP'), makeRow({ technical_status: 'validated' }));
    expect(screen.getByTestId('technical-status-cell')).toHaveTextContent('validated');
  });

  it('affiche le statut métier via BusinessStatusCell', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Statut facture'), makeRow({ business_status: '205' }));
    expect(screen.getByTestId('business-status-cell')).toHaveTextContent('205');
  });

  it('remplace le statut métier par "Non renseigné" si statut technique est "rejected"', () => {
    const columns = getColumns(makeInvoiceService());
    renderCell(col(columns, 'Statut facture'), makeRow({ technical_status: 'rejected', business_status: '205' }));
    expect(screen.getByTestId('business-status-cell')).toHaveTextContent('Non renseigné');
  });

  it('affiche les montants formatés (HT, TVA, TTC)', () => {
    const columns = getColumns(makeInvoiceService());

    const { unmount: u1 } = renderCell(col(columns, 'HT'), makeRow({ subtotal: 1000 }));
    expect(screen.getByText('1000 €')).toBeInTheDocument();
    u1();

    const { unmount: u2 } = renderCell(col(columns, 'TVA'), makeRow({ total_taxes: 200 }));
    expect(screen.getByText('200 €')).toBeInTheDocument();
    u2();

    renderCell(col(columns, 'TTC'), makeRow({ total: 1200 }));
    expect(screen.getByText('1200 €')).toBeInTheDocument();
  });

  it('affiche le tooltip d\'annulation avec le motif si status="cancelled"', () => {
    const columns = getColumns(makeInvoiceService());
    const { container } = renderCell(
      col(columns, 'Type'),
      makeRow({ status: 'cancelled', cancel_reason: 'Doublon' })
    );
    const span = container.querySelector('[title]');
    expect(span?.title).toMatch(/Annulée.*Doublon/);
  });
});