import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvoiceLines from "./InvoiceLines";
import { vi } from "vitest";
import { validateInvoiceLine } from "../../utils/validators/invoice";

const mockOnChange = vi.fn();

// Mock du validateur
vi.mock("../../utils/validators/invoice", () => ({
  validateInvoiceLine: vi.fn(() => ({})),
}));

describe("InvoiceLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const initialData = [
    {
      description: "Produit A",
      quantity: 2,
      unit_price: 10,
      vat_rate: 20,
      discount: 0,
      line_net: 20,
      line_tax: 4,
      line_total: 24,
    },
  ];

  it("affiche les champs pour chaque ligne", () => {
    render(<InvoiceLines data={initialData} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantité/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Prix unitaire/i)).toHaveValue(10);

    // Labels TVA précis
    expect(screen.getByLabelText(/TVA \(%\)/i)).toHaveValue(20);
    expect(screen.getByLabelText(/^HT$/i)).toHaveValue(20);
    expect(screen.getByLabelText(/^TTC$/i)).toHaveValue(24);
  });

  it("met à jour une ligne et recalcul les montants", async () => {
    render(<InvoiceLines data={initialData} onChange={mockOnChange} />);

    const qtyInput = screen.getByLabelText(/Quantité/i);
    fireEvent.change(qtyInput, { target: { value: 3 } }); // string renvoyée par l'input

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            quantity: "3", // string comme renvoyée par l'input
            line_net: 30,
            line_tax: 6,
            line_total: 36,
            unit_price: 10,
            vat_rate: 20,
            discount: 0,
            description: "Produit A",
          }),
        ])
      );
    });
  });

  it("ajoute une nouvelle ligne", async () => {
    render(<InvoiceLines data={initialData} onChange={mockOnChange} />);

    const addButton = screen.getByText(/Ajouter une ligne/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ description: "" })])
      );
    });
  });

  it("supprime une ligne", async () => {
    render(<InvoiceLines data={initialData} onChange={mockOnChange} />);

    // On récupère tous les boutons du DOM (le premier devrait être le delete)
    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons[0]; 
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  it("valide un champ au blur", async () => {
    render(<InvoiceLines data={initialData} onChange={mockOnChange} />);

    const descInput = screen.getByLabelText(/Description/i);
    fireEvent.blur(descInput);

    await waitFor(() => {
      expect(validateInvoiceLine).toHaveBeenCalledWith(initialData[0]);
    });
  });
});
