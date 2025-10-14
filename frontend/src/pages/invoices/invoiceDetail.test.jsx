import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import InvoiceDetail from "./InvoiceDetail";
import { BrowserRouter, useParams, useNavigate } from "react-router-dom";
import { vi } from "vitest";

// Mock des services
const mockInvoiceService = {
  fetchInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
};
const mockClientService = {
  fetchClient: vi.fn(),
};

// Mock hooks et navigate
vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => mockInvoiceService,
}));
vi.mock("@/services/clients", () => ({
  useClientService: () => mockClientService,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => vi.fn(),
  };
});

// Mock InvoiceForm et Breadcrumb pour simplifier le test
vi.mock("../../components/invoices/InvoiceForm", () => ({
  default: (props) => (
    <div data-testid="invoice-form">
      <button onClick={() => props.onSubmit({ some: "data" })}>Update</button>
      <button onClick={props.onDelete}>Delete</button>
      <span>InvoiceForm</span>
    </div>
  ),
}));
vi.mock("../../components/layout/Breadcrumb", () => ({
  default: ({ items }) => (
    <div data-testid="breadcrumb">{items.map(i => i.label).join(" > ")}</div>
  ),
}));

describe("InvoiceDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le message de chargement avant fetch", () => {
    mockInvoiceService.fetchInvoice.mockReturnValue(new Promise(() => {}));
    render(
      <BrowserRouter>
        <InvoiceDetail />
      </BrowserRouter>
    );
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it("charge la facture et le client puis affiche InvoiceForm et Breadcrumb", async () => {
    mockInvoiceService.fetchInvoice.mockResolvedValue({
      id: "1",
      invoice_number: "INV-001",
      client_id: "10",
      technical_status: "draft",
      business_status: "208",
      lines: [],
      taxes: [],
      attachments: [],
    });
    mockClientService.fetchClient.mockResolvedValue({
      legal_name: "ACME Corp",
    });

    render(
      <BrowserRouter>
        <InvoiceDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("invoice-form")).toBeInTheDocument();
      expect(screen.getByTestId("breadcrumb")).toHaveTextContent("Accueil > Factures > INV-001");
    });
  });

  it("handleUpdate appelle updateInvoice et affiche le message de succès", async () => {
    const updatedInvoice = { id: "1", invoice_number: "INV-001", lines: [] };
    mockInvoiceService.fetchInvoice.mockResolvedValue(updatedInvoice);
    mockInvoiceService.updateInvoice.mockResolvedValue(updatedInvoice);
    mockClientService.fetchClient.mockResolvedValue({});

    render(
      <BrowserRouter>
        <InvoiceDetail />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByTestId("invoice-form"));

    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(mockInvoiceService.updateInvoice).toHaveBeenCalledWith("1", { some: "data" });
      expect(screen.getByRole("alert")).toHaveTextContent(/mise à jour avec succès/i);
    });
  });

  it("handleDelete ne fait rien si confirm false", async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    mockInvoiceService.fetchInvoice.mockResolvedValue({ id: "1", invoice_number: "INV-001" });

    render(
      <BrowserRouter>
        <InvoiceDetail />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByTestId("invoice-form"));

    fireEvent.click(screen.getByText("Delete"));
    expect(mockInvoiceService.deleteInvoice).not.toHaveBeenCalled();
  });
});
