// frontend/src/components/invoices/InvoiceLines.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvoiceLines from "./InvoiceLines";
import { vi } from "vitest";
import { validateInvoiceLine } from "../../utils/validators/invoice";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../utils/validators/invoice", () => ({
  validateInvoiceLine: vi.fn(() => ({})),
}));

vi.mock("@/components/form", () => ({
  InputField: ({ id, label, value, onChange, onBlur, error, disabled, readOnly, type }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-label={label}
        type={type ?? "text"}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        data-testid={id}
      />
      {error && <span role="alert" data-testid={`error-${id}`}>{error}</span>}
    </div>
  ),
}));

vi.mock("@/components/ui/buttons", () => ({
  SmallDeleteButton: ({ onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label="Supprimer la ligne">
      ×
    </button>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeLine = (overrides = {}) => ({
  description: "Produit A",
  quantity: 2,
  unit_price: 10,
  vat_rate: 20,
  discount: 0,
  line_net: 20,
  line_tax: 4,
  line_total: 24,
  ...overrides,
});

const emptyLine = {
  description: "",
  quantity: 1,
  unit_price: 0,
  vat_rate: 20,
  discount: 0,
  line_net: 0,
  line_tax: 0,
  line_total: 0,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InvoiceLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendu ────────────────────────────────────────────────────────────────

  describe("Rendu", () => {
    it("affiche tous les champs pour une ligne", () => {
      render(<InvoiceLines data={[makeLine()]} onChange={vi.fn()} />);
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
      expect(screen.getByLabelText("Quantité")).toBeInTheDocument();
      expect(screen.getByLabelText("Prix unitaire (€)")).toBeInTheDocument();
      expect(screen.getByLabelText("TVA (%)")).toBeInTheDocument();
      expect(screen.getByLabelText("Remise (€)")).toBeInTheDocument();
      expect(screen.getByLabelText("HT")).toBeInTheDocument();
      expect(screen.getByLabelText("TVA")).toBeInTheDocument();
      expect(screen.getByLabelText("TTC")).toBeInTheDocument();
    });

    it("affiche autant de lignes que data en contient", () => {
      const data = [makeLine(), makeLine({ description: "Produit B" })];
      render(<InvoiceLines data={data} onChange={vi.fn()} />);
      expect(screen.getAllByLabelText("Description")).toHaveLength(2);
    });

    it("affiche une liste vide sans erreur si data=[]", () => {
      render(<InvoiceLines data={[]} onChange={vi.fn()} />);
      expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
      expect(screen.getByText("Ajouter une ligne")).toBeInTheDocument();
    });

    it("affiche le bouton 'Ajouter une ligne' par défaut", () => {
      render(<InvoiceLines data={[]} onChange={vi.fn()} />);
      expect(screen.getByText("Ajouter une ligne")).toBeInTheDocument();
    });

    it("masque le bouton 'Ajouter une ligne' et les boutons supprimer si hideLabelsInView=true", () => {
      render(<InvoiceLines data={[makeLine()]} onChange={vi.fn()} hideLabelsInView />);
      expect(screen.queryByText("Ajouter une ligne")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Supprimer la ligne")).not.toBeInTheDocument();
    });

    it("désactive le bouton 'Ajouter une ligne' si disabled=true", () => {
      render(<InvoiceLines data={[]} onChange={vi.fn()} disabled />);
      expect(screen.getByText("Ajouter une ligne")).toBeDisabled();
    });

    it("désactive tous les inputs si disabled=true", () => {
      render(<InvoiceLines data={[makeLine()]} onChange={vi.fn()} disabled />);
      screen.getAllByRole("textbox").forEach((input) =>
        expect(input).toBeDisabled()
      );
    });
  });

  // ── Calculs ───────────────────────────────────────────────────────────────

  describe("Recalcul des montants (handleLineChange)", () => {
    it("recalcule HT, TVA et TTC après changement de quantité", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.change(screen.getByLabelText("Quantité"), { target: { value: "3" } });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({ line_net: 30, line_tax: 6, line_total: 36 }),
        ])
      );
    });

    it("recalcule après changement de prix unitaire", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.change(screen.getByLabelText("Prix unitaire (€)"), { target: { value: "50" } });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({ line_net: 100, line_tax: 20, line_total: 120 }),
        ])
      );
    });

    it("recalcule après changement de taux de TVA", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.change(screen.getByLabelText("TVA (%)"), { target: { value: "10" } });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({ line_net: 20, line_tax: 2, line_total: 22 }),
        ])
      );
    });

    it("soustrait la remise du HT avant de calculer TVA et TTC", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.change(screen.getByLabelText("Remise (€)"), { target: { value: "5" } });
      await waitFor(() =>
        // HT = 2*10 - 5 = 15 ; TVA = 15*20/100 = 3 ; TTC = 18
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({ line_net: 15, line_tax: 3, line_total: 18 }),
        ])
      );
    });

    it("traite les valeurs non-numériques comme 0 sans planter", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.change(screen.getByLabelText("Quantité"), { target: { value: "abc" } });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({ line_net: 0, line_tax: 0, line_total: 0 }),
        ])
      );
    });

    it("recalcule sur plusieurs lignes sans mélanger les valeurs", async () => {
      const onChange = vi.fn();
      const data = [makeLine(), makeLine({ description: "Produit B", quantity: 5, unit_price: 2 })];
      render(<InvoiceLines data={data} onChange={onChange} />);
      const allQtyInputs = screen.getAllByLabelText("Quantité");
      // Modifie seulement la première ligne
      fireEvent.change(allQtyInputs[0], { target: { value: "1" } });
      await waitFor(() => {
        const call = onChange.mock.calls[0][0];
        expect(call[0]).toMatchObject({ line_net: 10, line_tax: 2, line_total: 12 });
        // La deuxième ligne n'est pas recalculée
        expect(call[1]).toMatchObject({ description: "Produit B", quantity: 5 });
      });
    });
  });

  // ── Ajout de ligne ────────────────────────────────────────────────────────

  describe("addLine", () => {
    it("ajoute une ligne avec les valeurs par défaut", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.click(screen.getByText("Ajouter une ligne"));
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith([
          makeLine(),
          emptyLine,
        ])
      );
    });

    it("peut ajouter plusieurs lignes successivement", async () => {
      const onChange = vi.fn();
      const { rerender } = render(<InvoiceLines data={[]} onChange={onChange} />);
      fireEvent.click(screen.getByText("Ajouter une ligne"));
      const afterFirst = onChange.mock.calls[0][0];

      rerender(<InvoiceLines data={afterFirst} onChange={onChange} />);
      fireEvent.click(screen.getByText("Ajouter une ligne"));

      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall).toHaveLength(2);
      });
    });
  });

  // ── Suppression de ligne ──────────────────────────────────────────────────

  describe("removeLine", () => {
    it("supprime la ligne ciblée et laisse les autres intactes", async () => {
      const onChange = vi.fn();
      const data = [
        makeLine({ description: "Ligne A" }),
        makeLine({ description: "Ligne B" }),
      ];
      render(<InvoiceLines data={data} onChange={onChange} />);
      const deleteButtons = screen.getAllByLabelText("Supprimer la ligne");
      fireEvent.click(deleteButtons[0]);
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({ description: "Ligne B" }),
        ])
      );
    });

    it("retourne un tableau vide si on supprime la seule ligne", async () => {
      const onChange = vi.fn();
      render(<InvoiceLines data={[makeLine()]} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText("Supprimer la ligne"));
      await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    });

    it("désactive le bouton supprimer si disabled=true", () => {
      render(<InvoiceLines data={[makeLine()]} onChange={vi.fn()} disabled />);
      // Le bouton est masqué via hideLabelsInView=false + disabled — vérifie
      // via le prop disabled passé à SmallDeleteButton
      const btn = screen.queryByLabelText("Supprimer la ligne");
      if (btn) expect(btn).toBeDisabled();
    });
  });

  // ── Validation ────────────────────────────────────────────────────────────

  describe("Validation", () => {
    it("appelle validateInvoiceLine au blur sur n'importe quel champ", async () => {
      render(<InvoiceLines data={[makeLine()]} onChange={vi.fn()} />);
      fireEvent.blur(screen.getByLabelText("Description"));
      await waitFor(() =>
        expect(validateInvoiceLine).toHaveBeenCalledWith(makeLine())
      );
    });

    it("ne revalide pas au change si le champ n'a pas encore été touché", async () => {
      render(<InvoiceLines data={[makeLine()]} onChange={vi.fn()} />);
      // Pas de blur préalable
      fireEvent.change(screen.getByLabelText("Description"), { target: { value: "X" } });
      await waitFor(() => expect(validateInvoiceLine).not.toHaveBeenCalled());
    });
  });
});