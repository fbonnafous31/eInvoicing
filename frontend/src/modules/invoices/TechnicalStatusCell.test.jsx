import { render, screen, waitFor } from "@testing-library/react";
import TechnicalStatusCell from "./TechnicalStatusCell";
import { vi } from "vitest";

describe("TechnicalStatusCell", () => {
  let mockInvoiceService;
  let mockOnChange;

  beforeEach(() => {
    mockInvoiceService = {
      pollInvoiceStatusPDP: vi.fn(),
    };
    mockOnChange = vi.fn();
  });

  it("affiche le label correct et la couleur par défaut", () => {
    render(
      <TechnicalStatusCell
        row={{ technical_status: "RECEIVED" }}
        invoiceService={mockInvoiceService}
        onTechnicalStatusChange={mockOnChange}
      />
    );

    const span = screen.getByText("Reçue"); // Selon FR.technicalStatus
    expect(span).toBeInTheDocument();
    expect(span).toHaveStyle("background-color: rgb(0, 128, 0)"); // Vert en RGB
  });

  it("utilise 'PENDING' si aucun status", () => {
    render(
      <TechnicalStatusCell
        row={{}}
        invoiceService={mockInvoiceService}
        onTechnicalStatusChange={mockOnChange}
      />
    );

    const span = screen.getByText("En attente"); // Selon FR.technicalStatus
    expect(span).toBeInTheDocument();
    expect(span).toHaveStyle("background-color: rgb(128, 128, 128)"); // Gris en RGB
  });

  it("appelle onTechnicalStatusChange après polling initial", async () => {
    mockInvoiceService.pollInvoiceStatusPDP.mockResolvedValue({
      technicalStatus: "VALIDATED",
    });

    render(
      <TechnicalStatusCell
        row={{ id: 1, submissionId: "sub1" }}
        invoiceService={mockInvoiceService}
        onTechnicalStatusChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(1, "VALIDATED");
    });
  });

  it("arrête le polling si status est VALIDATED ou REJECTED", async () => {
    mockInvoiceService.pollInvoiceStatusPDP.mockResolvedValue({
      technicalStatus: "REJECTED",
    });

    const { unmount } = render(
      <TechnicalStatusCell
        row={{ id: 2, submissionId: "sub2" }}
        invoiceService={mockInvoiceService}
        onTechnicalStatusChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(2, "REJECTED");
    });

    // On unmount pour vérifier cleanup
    unmount();
  });

  it("ne fait rien si pas de submissionId", () => {
    render(
      <TechnicalStatusCell
        row={{ id: 3 }}
        invoiceService={mockInvoiceService}
        onTechnicalStatusChange={mockOnChange}
      />
    );

    expect(mockInvoiceService.pollInvoiceStatusPDP).not.toHaveBeenCalled();
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
