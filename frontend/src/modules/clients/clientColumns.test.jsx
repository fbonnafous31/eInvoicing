import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useNavigate } from "react-router-dom";
import useClientColumns from "./clientColumns";

import EllipsisCell from "../../components/common/EllipsisCell";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../../components/common/EllipsisCell", () => ({
  __esModule: true,
  default: ({ value }) => <span>{value}</span>,
}));

describe("useClientColumns", () => {
  it("retourne un tableau de colonnes correct", () => {
    const mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);

    const { result } = renderHook(() => useClientColumns());
    const columns = result.current;

    expect(columns).toHaveLength(10);
    expect(columns.map(c => c.name)).toEqual([
      "Actions",
      "Identifiant",
      "Nom",
      "Adresse",
      "Code postal",
      "Ville",
      "Pays",
      "Email",
      "Téléphone",
      "Type",
    ]);

    // tester la colonne Actions
    const actionCell = columns[0].cell({ id: 123 });
    act(() => {
      actionCell.props.onClick();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/clients/123");

    // tester un selector
    const identCol = columns[1];
    expect(identCol.selector({ legal_identifier: "ABC" })).toBe("ABC");
  });

  it("retourne les bonnes valeurs pour Nom selon is_company", () => {
    const { result } = renderHook(() => useClientColumns());
    const nomCol = result.current[2];

    expect(nomCol.selector({ is_company: true, legal_name: "ACME" })).toBe("ACME");
    expect(nomCol.selector({ is_company: false, firstname: "John", lastname: "Doe" })).toBe("John Doe");
  });

  it("utilise les fallbacks pour Email et Téléphone", () => {
    const { result } = renderHook(() => useClientColumns());
    const emailCol = result.current[7];
    const phoneCol = result.current[8];

    expect(emailCol.selector({})).toBe("");
    expect(phoneCol.selector({})).toBe("");
  });
});
