// PdfViewer.test.jsx

// 🔹 Mock complet avant import
vi.mock("react-pdf", () => ({
  Document: ({ children }) => <div data-testid="document">{children}</div>,
  Page: () => <div data-testid="page">Page</div>,
  pdfjs: { GlobalWorkerOptions: {} },
}));

import { render, screen, fireEvent } from "@testing-library/react";
import PdfViewer from "./PdfViewer";

describe("PdfViewer", () => {
  const fileUrl = "/dummy.pdf";
  const invoiceId = 123;

  it("affiche les contrôles et le bouton de téléchargement", () => {
    render(<PdfViewer fileUrl={fileUrl} invoiceId={invoiceId} />);
    expect(screen.getByTestId("document")).toBeInTheDocument();
    expect(screen.getByTestId("page")).toBeInTheDocument();
    expect(screen.getByText(/Télécharger/i)).toBeInTheDocument();
  });

  it("affiche un message si aucun PDF disponible", () => {
    render(<PdfViewer />);
    expect(screen.getByText(/Aucun PDF disponible/i)).toBeInTheDocument();
  });

  it("permet de cliquer sur tous les boutons", () => {
    render(<PdfViewer fileUrl={fileUrl} invoiceId={invoiceId} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => fireEvent.click(btn));
  });
});
