// src/components/SupportingDocs.test.jsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import SupportingDocs from "./SupportingDocs";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { waitFor } from "@testing-library/react";

// ----------------------
// Mocks hooks/services
// ----------------------
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("fake-token"),
  }),
}));

const mockOnChange = vi.fn();
const mockFetchInvoicePdf = vi.fn().mockResolvedValue(
  new Blob(["pdf content"], { type: "application/pdf" })
);

vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => ({
    fetchInvoicePdf: mockFetchInvoicePdf,
  }),
}));

// ----------------------
// Sample data
// ----------------------
const sampleData = [
  { file_name: "facture.pdf", attachment_type: "main" },
  { file_name: "pièce1.pdf", attachment_type: "additional" },
];

// ----------------------
// Tests
// ----------------------
describe("SupportingDocs", () => {
  beforeEach(() => {
    mockOnChange.mockClear();
    mockFetchInvoicePdf.mockClear();

    // Mocks jsdom pour createObjectURL / revokeObjectURL
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => "blob-url");
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  it("rend le composant avec les fichiers existants", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    expect(screen.getByText(/facture.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/pièce1.pdf/i)).toBeInTheDocument();
  });

  it("supprime un justificatif principal", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    const mainFileRow = screen.getByText(/facture.pdf/i).closest("div");
    const deleteBtn = within(mainFileRow).getByRole("button");
    fireEvent.click(deleteBtn);

    expect(mockOnChange).toHaveBeenCalledWith([
      { file_name: "pièce1.pdf", attachment_type: "additional" },
    ]);
  });

  it("supprime un justificatif additionnel", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    const additionalFileRow = screen.getByText(/pièce1.pdf/i).closest("li");
    const deleteBtn = within(additionalFileRow).getByRole("button");
    fireEvent.click(deleteBtn);

    expect(mockOnChange).toHaveBeenCalledWith([
      { file_name: "facture.pdf", attachment_type: "main" },
    ]);
  });

  it("cache les boutons et inputs si hideLabelsInView=true", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} hideLabelsInView />);

    // Les boutons et inputs conditionnés ne doivent pas être visibles
    expect(screen.queryByText(/Générer le PDF/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Regénérer le PDF/i)).not.toBeInTheDocument();

    const mainInput = screen.queryByLabelText(/Justificatif principal/i, { selector: "input" });
    expect(mainInput).not.toBeInTheDocument();

    const addInput = screen.queryByLabelText(/Justificatifs additionnels/i, { selector: "input" });
    expect(addInput).not.toBeInTheDocument();

    // Les fichiers listés restent visibles
    expect(screen.getByText(/facture.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/pièce1.pdf/i)).toBeInTheDocument();
  });

  it("génère le PDF via le bouton", async () => {
    render(
      <SupportingDocs
        data={sampleData}
        onChange={mockOnChange}
        invoice={{ header: { invoice_number: "123" } }}
      />
    );

    const button = screen.getByText(/Regénérer le PDF/i);
    fireEvent.click(button);

    // waitFor attend que les appels async soient faits
    await waitFor(() => {
      expect(mockFetchInvoicePdf).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});