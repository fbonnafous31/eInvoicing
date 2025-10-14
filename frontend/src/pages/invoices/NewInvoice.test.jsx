// frontend/src/pages/invoices/NewInvoice.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewInvoice from "./NewInvoice";
import { vi } from "vitest";

// -----------------------
// Mocks
// -----------------------
const mockCreateInvoice = vi.fn();
const mockNavigate = vi.fn();

// Mock du service invoices
vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => ({
    createInvoice: mockCreateInvoice,
  }),
}));

// Mock de react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock du composant InvoiceForm
vi.mock("../../components/invoices/InvoiceForm", () => ({
  __esModule: true,
  default: ({ onSubmit, disabled }) => (
    <form data-testid="invoice-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ foo: "bar" }); }}>
      <button disabled={disabled}>Submit</button>
    </form>
  ),
}));

// Mock du composant Breadcrumb
vi.mock("../../components/layout/Breadcrumb", () => ({
  __esModule: true,
  default: ({ items }) => <nav data-testid="breadcrumb">{items.map((i) => i.label).join(" > ")}</nav>,
}));

// Mock window.scrollTo pour éviter les warnings
beforeAll(() => {
  window.scrollTo = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// -----------------------
// Tests
// -----------------------
describe("NewInvoice", () => {
  it("affiche le formulaire et le breadcrumb", () => {
    render(<NewInvoice />);

    expect(screen.getByTestId("invoice-form")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Accueil > Factures > Nouvelle facture")).toBeInTheDocument();
  });

  it("crée une facture avec succès et affiche le message", async () => {
    mockCreateInvoice.mockResolvedValueOnce({ id: "inv123" });

    render(<NewInvoice />);

    fireEvent.submit(screen.getByTestId("invoice-form"));

    // Vérifier que le message de succès s'affiche
    await waitFor(() => {
      expect(screen.getByText(/Facture créée avec succès/i)).toBeInTheDocument();
      expect(mockCreateInvoice).toHaveBeenCalledWith({ foo: "bar" });
    });

    // Vérifier que navigate est appelé après 2 secondes
    await new Promise((r) => setTimeout(r, 2100));
    expect(mockNavigate).toHaveBeenCalledWith("/invoices");
  });

  it("affiche un message d'erreur si la création échoue", async () => {
    mockCreateInvoice.mockRejectedValueOnce(new Error("Erreur backend"));

    render(<NewInvoice />);

    fireEvent.submit(screen.getByTestId("invoice-form"));

    await waitFor(() => {
      expect(screen.getByText(/Erreur backend/i)).toBeInTheDocument();
    });

    expect(mockCreateInvoice).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("désactive le bouton pendant la soumission", async () => {
    let resolveSubmit;
    mockCreateInvoice.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      })
    );

    render(<NewInvoice />);

    const button = screen.getByText("Submit");
    fireEvent.submit(screen.getByTestId("invoice-form"));

    // Le bouton doit être désactivé pendant la soumission
    expect(button).toBeDisabled();

    // Résoudre la promesse pour terminer la soumission
    resolveSubmit({ id: "inv123" });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
