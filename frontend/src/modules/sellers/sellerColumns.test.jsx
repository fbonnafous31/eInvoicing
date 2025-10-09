// frontend/src/modules/sellers/sellerColumns.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import useSellerColumns from "./sellerColumns";

// 🔹 Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// 🔹 Mock EllipsisCell
vi.mock("../../components/common/EllipsisCell", () => ({
  default: ({ value, maxWidth }) => (
    <span data-testid="ellipsis-cell" style={{ maxWidth }}>{value}</span>
  )
}));

describe("useSellerColumns", () => {
  const row = {
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

  it("retourne les colonnes avec la bonne configuration", () => {
    const columns = useSellerColumns();

    expect(columns).toHaveLength(9);

    const names = columns.map(c => c.name);
    expect(names).toEqual([
      "Actions",
      "Identifiant",
      "Nom légal",
      "Adresse",
      "Code postal",
      "Ville",
      "Pays",
      "Email",
      "Téléphone",
    ]);
  });

  it("Actions : le bouton appelle navigate avec le bon chemin", () => {
    const columns = useSellerColumns();
    const button = render(columns[0].cell(row)).getByRole("button");

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(`/sellers/${row.id}`);
  });

  it("Les cellules EllipsisCell affichent la bonne valeur", () => {
    const columns = useSellerColumns();

    // Identifiant
    let { getByTestId, unmount } = render(columns[1].cell(row));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.legal_identifier);
    unmount();

    // Nom légal
    ({ getByTestId, unmount } = render(columns[2].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.legal_name);
    unmount();

    // Adresse
    ({ getByTestId, unmount } = render(columns[3].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.address);
    unmount();

    // Code postal
    ({ getByTestId, unmount } = render(columns[4].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.postal_code);
    unmount();

    // Ville
    ({ getByTestId, unmount } = render(columns[5].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.city);
    unmount();

    // Pays
    ({ getByTestId, unmount } = render(columns[6].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.country_code);
    unmount();

    // Email
    ({ getByTestId, unmount } = render(columns[7].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.contact_email);
    unmount();

    // Téléphone
    ({ getByTestId, unmount } = render(columns[8].cell(row)));
    expect(getByTestId("ellipsis-cell")).toHaveTextContent(row.phone_number);
    unmount();
  });
});
