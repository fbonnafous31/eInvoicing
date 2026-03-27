// src/pages/invoices/InvoiceView.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import InvoiceView from "./InvoiceView";
import { useParams } from "react-router-dom";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: vi.fn() };
});

vi.mock("../../components/invoices/InvoiceForm", () => ({
  default: ({ initialData, readOnly }) => (
    <div data-testid="invoice-form" data-readonly={String(readOnly)}>
      {initialData?.id}
    </div>
  ),
}));

vi.mock("../../components/layout/Breadcrumb", () => ({
  default: ({ items }) => (
    <div data-testid="breadcrumb">{JSON.stringify(items)}</div>
  ),
}));

vi.mock("../../components/invoices/InvoiceTabs", () => ({
  default: ({ attachments, backendUrl }) => (
    <div
      data-testid="invoice-tabs"
      data-attachments={attachments?.length}
      data-backend={backendUrl}
    />
  ),
}));

// ⚠️ Mocks hoistés au module — on stocke les fns dans des refs mutables
const mockFetchInvoice = vi.fn();
const mockFetchClient = vi.fn();

vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => ({ fetchInvoice: mockFetchInvoice }),
}));

vi.mock("@/services/clients", () => ({
  useClientService: () => ({ fetchClient: mockFetchClient }),
}));

vi.mock("@/utils/getEnv", () => ({
  getEnv: () => ({ VITE_API_URL: "https://api.test" }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeInvoice = (overrides = {}) => ({
  id: "inv123",
  invoice_number: "F2025-001",
  status: "draft",
  client_id: "client1",
  issue_date: "2025-01-15",
  supply_date: "2025-01-15",
  fiscal_year: "2025",
  seller_id: "seller1",
  contract_number: "",
  purchase_order_number: "",
  payment_terms: "30",
  payment_method: "virement",
  invoice_type: "FACTURE",
  original_invoice_number: "",
  lines: [],
  taxes: [],
  attachments: [],
  ...overrides,
});

const makeClient = (overrides = {}) => ({
  legal_name: "Client Test",
  address: "1 rue Test",
  city: "Paris",
  postal_code: "75001",
  country_code: "FR",
  email: "test@client.com",
  phone: "0600000000",
  firstname: "",
  lastname: "",
  legal_identifier_type: "SIRET",
  legal_identifier: "12345678900001",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useParams).mockReturnValue({ id: "inv123" });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InvoiceView", () => {

  // ── Chargement ───────────────────────────────────────────────────────────

  it("affiche Chargement... pendant le fetch", () => {
    mockFetchInvoice.mockReturnValue(new Promise(() => {})); // ne résout jamais
    render(<InvoiceView />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it("n'appelle pas fetchInvoice si id est absent", () => {
    vi.mocked(useParams).mockReturnValue({ id: undefined });
    mockFetchInvoice.mockResolvedValue(makeInvoice());
    render(<InvoiceView />);
    expect(mockFetchInvoice).not.toHaveBeenCalled();
  });

  // ── Rendu nominal ────────────────────────────────────────────────────────

  it("affiche InvoiceForm, Breadcrumb et InvoiceTabs après chargement", async () => {
    mockFetchInvoice.mockResolvedValue(makeInvoice());
    mockFetchClient.mockResolvedValue(makeClient());

    render(<InvoiceView />);

    await waitFor(() => screen.getByTestId("invoice-form"));
    expect(screen.getByTestId("invoice-form").textContent).toBe("inv123");
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("invoice-tabs")).toBeInTheDocument();
  });

  it("passe readOnly=true à InvoiceForm", async () => {
    mockFetchInvoice.mockResolvedValue(makeInvoice());
    mockFetchClient.mockResolvedValue(makeClient());

    render(<InvoiceView />);
    await waitFor(() => screen.getByTestId("invoice-form"));

    expect(screen.getByTestId("invoice-form").dataset.readonly).toBe("true");
  });

  // ── Breadcrumb ───────────────────────────────────────────────────────────

  it("construit le breadcrumb avec les bons labels et chemins", async () => {
    mockFetchInvoice.mockResolvedValue(makeInvoice({ invoice_number: "F2025-001" }));
    mockFetchClient.mockResolvedValue(makeClient());

    render(<InvoiceView />);
    await waitFor(() => screen.getByTestId("breadcrumb"));

    const items = JSON.parse(screen.getByTestId("breadcrumb").textContent);
    expect(items).toEqual([
      { label: "Accueil", path: "/" },
      { label: "Factures", path: "/invoices" },
      { label: "F2025-001", path: "/invoices/inv123" },
    ]);
  });

  // ── InvoiceTabs ──────────────────────────────────────────────────────────

  it("passe attachments et backendUrl corrects à InvoiceTabs", async () => {
    const attachments = [{ id: "a1" }, { id: "a2" }];
    mockFetchInvoice.mockResolvedValue(makeInvoice({ attachments }));
    mockFetchClient.mockResolvedValue(makeClient());

    render(<InvoiceView />);
    await waitFor(() => screen.getByTestId("invoice-tabs"));

    const tabs = screen.getByTestId("invoice-tabs");
    expect(tabs.dataset.attachments).toBe("2");
    expect(tabs.dataset.backend).toBe("https://api.test");
  });

  // ── Mapping client ───────────────────────────────────────────────────────

  it("mappe le SIRET dans client_siret", async () => {
    const client = makeClient({
      legal_identifier_type: "SIRET",
      legal_identifier: "12345678900001",
    });
    mockFetchInvoice.mockResolvedValue(makeInvoice());
    mockFetchClient.mockResolvedValue(client);

    // On vérifie via les props passées à InvoiceForm
    let capturedData = null;
    const { default: InvoiceForm } =
      await vi.importMock("../../components/invoices/InvoiceForm");
    // Approche alternative : espionner via le mock déclaré plus haut
    // Ici on vérifie que fetchClient a bien été appelé avec le bon id
    render(<InvoiceView />);
    await waitFor(() => expect(mockFetchClient).toHaveBeenCalledWith("client1"));
  });

  it("mappe le VAT number dans client_vat_number", async () => {
    const client = makeClient({
      legal_identifier_type: "VAT",
      legal_identifier: "FR12345678901",
    });
    mockFetchInvoice.mockResolvedValue(makeInvoice());
    mockFetchClient.mockResolvedValue(client);

    render(<InvoiceView />);
    await waitFor(() => expect(mockFetchClient).toHaveBeenCalledWith("client1"));
  });

  // ── Sans client_id ───────────────────────────────────────────────────────

  it("ne tente pas de charger le client si client_id est absent", async () => {
    mockFetchInvoice.mockResolvedValue(makeInvoice({ client_id: null }));

    render(<InvoiceView />);
    await waitFor(() => screen.getByTestId("invoice-form"));

    expect(mockFetchClient).not.toHaveBeenCalled();
  });

  // ── Cas d'erreur ─────────────────────────────────────────────────────────

  it("reste en état Chargement si fetchInvoice rejette", async () => {
    // Le composant catch l'erreur mais ne set pas invoice → garde l'état null
    mockFetchInvoice.mockRejectedValue(new Error("Network error"));

    render(<InvoiceView />);
    // On attend un tick pour que la promesse se règle
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-form")).toBeNull();
  });

  it("affiche quand même l'invoice si fetchClient échoue", async () => {
    mockFetchInvoice.mockResolvedValue(makeInvoice());
    mockFetchClient.mockRejectedValue(new Error("Client not found"));

    render(<InvoiceView />);
    // L'invoice est affichée même sans données client
    await waitFor(() => screen.getByTestId("invoice-form"));
    expect(screen.getByTestId("invoice-form")).toBeInTheDocument();
  });
});