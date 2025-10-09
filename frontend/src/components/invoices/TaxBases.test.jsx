import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaxBases from "./TaxBases";
import { vi } from "vitest";

const mockOnChange = vi.fn();

describe("TaxBases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const initialData = [
    { vat_rate: 20, base_amount: 200, tax_amount: 40 },
  ];

  it("affiche les champs pour chaque assiette", () => {
    render(<TaxBases data={initialData} onChange={mockOnChange} />);

    expect(screen.getByRole("spinbutton", { name: /TVA/i })).toHaveValue(20);
    expect(screen.getByRole("spinbutton", { name: /Base/i })).toHaveValue(200);

    // Montant TVA readOnly : matcher par valeur formatée
    const tvaAmountInput = screen.getByDisplayValue(
      (content, element) =>
        element.tagName.toLowerCase() === "input" &&
        content === (initialData[0].tax_amount?.toFixed(2) || "0")
    );
    expect(tvaAmountInput).toBeInTheDocument();

    expect(screen.getByText(/Ajouter une assiette/i)).toBeInTheDocument();
  });

  it("met à jour la base et recalcule la TVA", async () => {
    render(<TaxBases data={initialData} onChange={mockOnChange} />);

    const baseInput = screen.getByRole("spinbutton", { name: /Base/i });
    fireEvent.change(baseInput, { target: { value: "300" } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          base_amount: "300", // string car issue du input
          vat_rate: 20,
          tax_amount: 60, // nombre
        }),
      ]);
    });
  });

  it("met à jour le taux de TVA et recalcule la taxe", async () => {
    // ⚠️ initialiser base_amount en nombre pour matcher le comportement réel
    render(<TaxBases data={[{ vat_rate: 20, base_amount: 300, tax_amount: 60 }]} onChange={mockOnChange} />);

    const vatInput = screen.getByRole("spinbutton", { name: /TVA/i });
    fireEvent.change(vatInput, { target: { value: "10" } });

    await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
        {
            vat_rate: "10",      // string
            base_amount: 300,    // number ici, car composant parseFloat avant calcul
            tax_amount: 30,      // number
        },
        ]);
    });
  });

  it("ajoute une nouvelle assiette", async () => {
    render(<TaxBases data={initialData} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText(/Ajouter une assiette/i));

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        ...initialData,
        expect.objectContaining({ vat_rate: 20, base_amount: 0, tax_amount: 0 }),
      ]);
    });
  });

  it("supprime une assiette", async () => {
    render(<TaxBases data={initialData} onChange={mockOnChange} />);

    const deleteButtons = screen.getAllByRole("button");
    fireEvent.click(deleteButtons.find((btn) => btn.title === "Supprimer"));

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  it("désactive les champs et boutons si disabled = true", () => {
    render(<TaxBases data={initialData} onChange={mockOnChange} disabled />);

    const tvaRateInput = screen.getByRole("spinbutton", { name: /TVA/i });
    const baseInput = screen.getByRole("spinbutton", { name: /Base/i });

    const tvaAmountInput = screen.getByDisplayValue(
      (content, element) =>
        element.tagName.toLowerCase() === "input" &&
        content === (initialData[0].tax_amount?.toFixed(2) || "0")
    );

    expect(tvaRateInput).toBeDisabled();
    expect(baseInput).toBeDisabled();
    expect(tvaAmountInput).toBeDisabled();

    expect(screen.getByText(/Ajouter une assiette/i)).toBeDisabled();
    expect(screen.getByTitle(/Supprimer/i)).toBeDisabled();
  });

  it("masque les labels et boutons si hideLabelsInView = true", () => {
    render(<TaxBases data={initialData} onChange={mockOnChange} hideLabelsInView />);

    expect(screen.queryByText(/Ajouter une assiette/i)).toBeNull();
    expect(screen.queryByTitle(/Supprimer/i)).toBeNull();
  });
});
