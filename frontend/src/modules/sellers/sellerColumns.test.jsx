// frontend/src/modules/sellers/sellerColumns.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useSellerColumns from "./sellerColumns";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../components/common/EllipsisCell", () => ({
  default: ({ value, maxWidth }) => (
    <span data-testid="ellipsis-cell" data-maxwidth={maxWidth}>{value}</span>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Wrapper nécessaire car useSellerColumns appelle useNavigate (hook React)
function ColumnsHarness({ callback }) {
  const columns = useSellerColumns();
  callback(columns);
  return null;
}

function getColumns() {
  let cols;
  render(<ColumnsHarness callback={(c) => { cols = c; }} />);
  return cols;
}

const fullRow = {
  id: 42,
  legal_identifier: "ABC123",
  legal_name: "Entreprise Test",
  address: "1 Rue de Test",
  postal_code: "75001",
  city: "Paris",
  country_code: "FR",
  contact_email: "contact@test.com",
  phone_number: "0123456789",
};

beforeEach(() => {
  // ⚠️ Sans ce clear, un clic dans un test précédent pollue le suivant
  mockNavigate.mockClear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useSellerColumns", () => {

  // ── Structure ──────────────────────────────────────────────────────────────

  describe("structure des colonnes", () => {
    it("retourne exactement 9 colonnes dans le bon ordre", () => {
      const columns = getColumns();
      expect(columns).toHaveLength(9);
      expect(columns.map((c) => c.name)).toEqual([
        "Actions", "Identifiant", "Nom légal", "Adresse",
        "Code postal", "Ville", "Pays", "Email", "Téléphone",
      ]);
    });

    it("toutes les colonnes hors Actions ont sortable: true", () => {
      const columns = getColumns();
      columns.slice(1).forEach((col) => {
        expect(col.sortable).toBe(true);
      });
    });

    it("la colonne Actions a ignoreRowClick: true", () => {
      const columns = getColumns();
      expect(columns[0].ignoreRowClick).toBe(true);
    });

    it.each([
      [0, "50px"],
      [1, "150px"],
      [4, "120px"],
      [6, "100px"],
      [7, "200px"],
      [8, "120px"],
    ])("colonne index %i a width: %s", (idx, expectedWidth) => {
      const columns = getColumns();
      expect(columns[idx].width).toBe(expectedWidth);
    });

    it("les colonnes Nom légal, Adresse, Ville n'ont pas de width fixe", () => {
      const columns = getColumns();
      [2, 3, 5].forEach((idx) => {
        expect(columns[idx].width).toBeUndefined();
      });
    });
  });

  // ── Selectors ─────────────────────────────────────────────────────────────

  describe("fonctions selector", () => {
    it.each([
      [1, "legal_identifier", "ABC123"],
      [2, "legal_name",       "Entreprise Test"],
      [3, "address",          "1 Rue de Test"],
      [4, "postal_code",      "75001"],
      [5, "city",             "Paris"],
      [6, "country_code",     "FR"],
      [7, "contact_email",    "contact@test.com"],
    ])("colonne %i sélectionne row.%s", (idx, field, expected) => {
      const columns = getColumns();
      expect(columns[idx].selector(fullRow)).toBe(expected);
    });

    it("selector Téléphone retourne '' si phone_number est absent", () => {
      const columns = getColumns();
      expect(columns[8].selector({ ...fullRow, phone_number: undefined })).toBe("");
      expect(columns[8].selector({ ...fullRow, phone_number: null })).toBe("");
    });

    it("selector Téléphone retourne la valeur si présente", () => {
      const columns = getColumns();
      expect(columns[8].selector(fullRow)).toBe("0123456789");
    });
  });

  // ── Cellule Actions ────────────────────────────────────────────────────────

  describe("cellule Actions", () => {
    it("navigue vers /sellers/:id au clic", () => {
      const columns = getColumns();
      const { getByRole } = render(columns[0].cell(fullRow));
      fireEvent.click(getByRole("button"));
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/sellers/42");
    });

    it("affiche le bouton avec l'icône ✏️", () => {
      const columns = getColumns();
      const { getByRole } = render(columns[0].cell(fullRow));
      expect(getByRole("button").textContent).toContain("✏️");
    });

    it("utilise l'id de la ligne, pas une valeur fixe", () => {
      const columns = getColumns();
      const otherRow = { ...fullRow, id: 99 };
      const { getByRole } = render(columns[0].cell(otherRow));
      fireEvent.click(getByRole("button"));
      expect(mockNavigate).toHaveBeenCalledWith("/sellers/99");
    });
  });

  // ── Cellules EllipsisCell ──────────────────────────────────────────────────

  describe("cellules EllipsisCell — maxWidth", () => {
    it.each([
      [1, "150px"],
      [4, "120px"],
      [6, "100px"],
      [7, "200px"],
      [8, "120px"],
    ])("colonne %i passe maxWidth=%s à EllipsisCell", (idx, expectedMax) => {
      const columns = getColumns();
      const { getByTestId } = render(columns[idx].cell(fullRow));
      expect(getByTestId("ellipsis-cell").dataset.maxwidth).toBe(expectedMax);
    });

    it("les colonnes sans maxWidth explicite ne passent pas de maxWidth", () => {
      const columns = getColumns();
      // Nom légal (idx 2), Adresse (3), Ville (5) n'ont pas de maxWidth
      [2, 3, 5].forEach((idx) => {
        const { getByTestId, unmount } = render(columns[idx].cell(fullRow));
        expect(getByTestId("ellipsis-cell").dataset.maxwidth).toBeUndefined();
        unmount();
      });
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("affiche une cellule vide sans crash si phone_number est undefined", () => {
      const columns = getColumns();
      const row = { ...fullRow, phone_number: undefined };
      const { getByTestId } = render(columns[8].cell(row));
      expect(getByTestId("ellipsis-cell").textContent).toBe("");
    });

    it("n'appelle pas navigate si le composant n'est pas cliqué", () => {
      const columns = getColumns();
      render(columns[0].cell(fullRow));
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("deux appels au hook retournent des colonnes indépendantes", () => {
      let cols1, cols2;
      render(<ColumnsHarness callback={(c) => { cols1 = c; }} />);
      render(<ColumnsHarness callback={(c) => { cols2 = c; }} />);
      // Même structure mais références différentes
      expect(cols1).toHaveLength(9);
      expect(cols2).toHaveLength(9);
      expect(cols1).not.toBe(cols2);
    });
  });
});