import { render, screen, fireEvent } from "@testing-library/react";
import InvoiceTabs from "./InvoiceTabs";
import PdfViewer from "./PdfViewer";
import { vi } from "vitest";

// Mock du PdfViewer pour ne pas charger de vrai PDF
vi.mock("./PdfViewer", () => ({
  default: vi.fn(({ fileUrl }) => <div data-testid="pdf-viewer">{fileUrl}</div>),
}));

describe("InvoiceTabs", () => {
  const backendUrl = "http://localhost:3000";

  const attachments = [
    { id: 1, file_name: "Facture1.pdf", stored_name: "file1.pdf" },
    { id: 2, file_name: "Facture2.pdf", stored_name: "file2.pdf" },
  ];

  it("affiche un message si pas de PDF", () => {
    render(<InvoiceTabs attachments={[]} backendUrl={backendUrl} />);
    expect(screen.getByText(/aucun pdf disponible/i)).toBeInTheDocument();
  });

  it("affiche les onglets pour chaque PDF et sélectionne le premier par défaut", () => {
    render(<InvoiceTabs attachments={attachments} backendUrl={backendUrl} />);

    attachments.forEach((att) => {
      expect(screen.getByText(att.file_name)).toBeInTheDocument();
    });

    // Vérifie que PdfViewer affiche le bon fichier
    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent(
      `${backendUrl}/uploads/invoices/${attachments[0].stored_name}`
    );
  });

  it("change le PDF affiché quand on clique sur un onglet", () => {
    render(<InvoiceTabs attachments={attachments} backendUrl={backendUrl} />);

    const secondTab = screen.getByText(attachments[1].file_name);
    fireEvent.click(secondTab);

    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent(
      `${backendUrl}/uploads/invoices/${attachments[1].stored_name}`
    );
  });

  it("applique un style différent sur l’onglet actif", () => {
    render(<InvoiceTabs attachments={attachments} backendUrl={backendUrl} />);

    const firstTab = screen.getByText(attachments[0].file_name);
    const secondTab = screen.getByText(attachments[1].file_name);

    // Premier onglet actif par défaut
    expect(firstTab).toHaveStyle("font-weight: 600");
    expect(secondTab).toHaveStyle("font-weight: 400");

    // Clique sur le second onglet
    fireEvent.click(secondTab);

    expect(firstTab).toHaveStyle("font-weight: 400");
    expect(secondTab).toHaveStyle("font-weight: 600");
  });
});
