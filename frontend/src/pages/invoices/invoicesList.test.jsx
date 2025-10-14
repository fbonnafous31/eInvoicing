import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // ✅ Utiliser MemoryRouter pour tests
import InvoicesList from "./InvoicesList";
import { vi } from "vitest";

// --- Mock invoice service ---
const mockInvoiceService = {
  fetchInvoicesBySeller: vi.fn(),
};

vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => mockInvoiceService,
}));

describe("InvoicesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche Chargement... pendant le fetch", async () => {
    mockInvoiceService.fetchInvoicesBySeller.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <InvoicesList />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Rechercher une facture/i)).toBeInTheDocument();
  });

  it("affiche les factures après fetch", async () => {
    const invoices = [
      { id: "1", invoice_number: "INV-001", technical_status: "draft", business_status: "208", created_at: "2025-10-01", updated_at: "2025-10-02" },
      { id: "2", invoice_number: "INV-002", technical_status: "validated", business_status: "210", created_at: "2025-10-03", updated_at: "2025-10-04" },
    ];

    mockInvoiceService.fetchInvoicesBySeller.mockResolvedValue(invoices);

    render(
      <MemoryRouter>
        <InvoicesList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/INV-001/i)).toBeInTheDocument();
      expect(screen.getByText(/INV-002/i)).toBeInTheDocument();
    });
  });

  it("filtre les factures selon le texte saisi", async () => {
    const invoices = [
      { id: "1", invoice_number: "INV-001", technical_status: "draft", business_status: "208" },
      { id: "2", invoice_number: "INV-002", technical_status: "validated", business_status: "210" },
    ];

    mockInvoiceService.fetchInvoicesBySeller.mockResolvedValue(invoices);

    render(
      <MemoryRouter>
        <InvoicesList />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/INV-001/i));

    const searchInput = screen.getByPlaceholderText(/Rechercher une facture/i);
    fireEvent.change(searchInput, { target: { value: "INV-002" } });

    await waitFor(() => {
      expect(screen.queryByText(/INV-001/i)).not.toBeInTheDocument();
      expect(screen.getByText(/INV-002/i)).toBeInTheDocument();
    });
  });
});
