// src/pages/invoices/InvoiceView.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import InvoiceView from "./InvoiceView";
import { useParams } from "react-router-dom";

// -------------------- Mocks --------------------

// Mock useParams pour fournir un id
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

// Mock des composants avec export default
vi.mock("../../components/invoices/InvoiceForm", () => ({
  default: ({ initialData, readOnly }) => (
    <div data-testid="invoice-form">{initialData?.id}</div>
  ),
}));

vi.mock("../../components/layout/Breadcrumb", () => ({
  default: ({ items }) => <div data-testid="breadcrumb">{JSON.stringify(items)}</div>,
}));

vi.mock("../../components/invoices/InvoiceTabs", () => ({
  default: ({ attachments }) => <div data-testid="invoice-tabs">{attachments?.length}</div>,
}));

// Mock des services
vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => ({
    fetchInvoice: vi.fn(),
  }),
}));

vi.mock("@/services/clients", () => ({
  useClientService: () => ({
    fetchClient: vi.fn(),
  }),
}));

// -------------------- Tests --------------------

describe("InvoiceView", () => {
  const invoiceMock = {
    id: "inv123",
    invoice_number: "F2025-001",
    client_id: "client1",
    client: {
      legal_name: "Client Test",
      address: "1 rue Test",
      city: "Paris",
      postal_code: "75001",
      country_code: "FR",
      email: "test@client.com",
    },
    lines: [],
    taxes: [],
    attachments: [],
  };

  const clientMock = {
    legal_name: "Client Test",
    address: "1 rue Test",
    city: "Paris",
    postal_code: "75001",
    country_code: "FR",
    email: "test@client.com",
  };

  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: "inv123" });
  });

  it("affiche Chargement... pendant le fetch", async () => {
    const { useInvoiceService } = await import("@/services/invoices");
    useInvoiceService().fetchInvoice.mockReturnValue(new Promise(() => {})); // Promise qui ne résout pas

    render(<InvoiceView />);
    expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
  });
});
