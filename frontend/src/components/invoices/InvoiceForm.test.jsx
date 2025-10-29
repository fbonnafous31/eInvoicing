import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvoiceForm from "./InvoiceForm";
import { vi } from "vitest";

// Supprime les logs pour garder le test propre
vi.spyOn(console, "log").mockImplementation(() => {});

// Mock useNavigate
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock useSellerService
vi.mock("../../services/sellers", () => ({
  useSellerService: () => ({
    fetchMySeller: vi.fn().mockResolvedValue([
      { id: 1, payment_terms: "upon_receipt", payment_method: "check" },
    ]),
  }),
}));

const minimalData = {
  header: { invoice_number: "INV-001", issue_date: "2025-10-29", fiscal_year: 2025 },
  client: {},
  lines: [],
  attachments: [],
};

// Mock window.scrollTo pour éviter les erreurs
window.scrollTo = vi.fn();

describe("InvoiceForm simple tests", () => {

  it("affiche le formulaire avec le bouton Créer la facture", () => {
    const { container } = render(<InvoiceForm initialData={null} readOnly={false} />);
    expect(container.querySelector("form")).toBeInTheDocument();
    expect(screen.getByText(/Créer la facture/i)).toBeInTheDocument();
  });

  it("rend le composant InvoiceHeader", () => {
    render(<InvoiceForm initialData={null} readOnly={false} />);
    expect(screen.getByLabelText(/Référence facture/i)).toBeInTheDocument();
  });

  it("ouvre et ferme une section du formulaire", () => {
    render(<InvoiceForm initialData={null} readOnly={false} />);

    const toggleButton = screen.getByText(/Informations facture/i);
    expect(toggleButton).toBeInTheDocument();

    // Ferme la section
    fireEvent.click(toggleButton);
    expect(screen.queryByLabelText(/Référence facture/i)).not.toBeInTheDocument();

    // Rouvre la section
    fireEvent.click(toggleButton);
    expect(screen.getByLabelText(/Référence facture/i)).toBeVisible();
  });

  it("désactive tous les champs en lecture seule", () => {
    render(<InvoiceForm initialData={minimalData} readOnly={true} />);

    // Vérifie que certains champs clés sont désactivés
    const invoiceNumber = screen.getByLabelText(/Référence facture/i);
    const issueDate = screen.getByLabelText(/Date émission/i);

    expect(invoiceNumber).toBeDisabled();
    expect(issueDate).toBeDisabled();

    // Si le bouton de création n'existe pas en lecture seule, on ne le teste pas
  });
});
