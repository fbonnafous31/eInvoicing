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
  default: ({ value, maxWidth }) => <span data-maxwidth={maxWidth}>{value}</span>,
}));

describe("useClientColumns", () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("retourne un tableau de 10 colonnes correct", () => {
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
  });

  it("colonne Actions appelle navigate avec le bon id", () => {
    const { result } = renderHook(() => useClientColumns());
    const actionCell = result.current[0].cell({ id: 42 });
    act(() => {
      actionCell.props.onClick();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/clients/42");
  });

  it("selectors Nom selon is_company", () => {
    const { result } = renderHook(() => useClientColumns());
    const nomCol = result.current[2];

    expect(nomCol.selector({ is_company: true, legal_name: "ACME" })).toBe("ACME");
    expect(nomCol.selector({ is_company: false, firstname: "John", lastname: "Doe" })).toBe("John Doe");
  });

  it("selectors Email et Téléphone utilisent les fallbacks", () => {
    const { result } = renderHook(() => useClientColumns());
    const emailCol = result.current[7];
    const phoneCol = result.current[8];

    expect(emailCol.selector({})).toBe("");
    expect(phoneCol.selector({})).toBe("");
  });

  it("selectors Adresse, Code postal, Ville, Pays, Type retournent les bonnes valeurs", () => {
    const { result } = renderHook(() => useClientColumns());
    const [ , , , addrCol, codeCol, villeCol, paysCol, , , typeCol ] = result.current;

    const row = {
      address: "123 rue de Paris",
      postal_code: "75001",
      city: "Paris",
      country_code: "FR",
      is_company: true
    };

    expect(addrCol.selector(row)).toBe("123 rue de Paris");
    expect(codeCol.selector(row)).toBe("75001");
    expect(villeCol.selector(row)).toBe("Paris");
    expect(paysCol.selector(row)).toBe("FR");
    expect(typeCol.selector(row)).toBe("Entreprise");
  });

  it("EllipsisCell reçoit la bonne valeur et maxWidth pour les colonnes concernées", () => {
    const { result } = renderHook(() => useClientColumns());
    const identCol = result.current[1];
    const codeCol = result.current[4];
    const paysCol = result.current[6];
    const emailCol = result.current[7];
    const phoneCol = result.current[8];

    const identCell = identCol.cell({ legal_identifier: "ABC123" });
    expect(identCell.props.value).toBe("ABC123");
    expect(identCell.props.maxWidth).toBe("150px");

    const codeCell = codeCol.cell({ postal_code: "75001" });
    expect(codeCell.props.value).toBe("75001");
    expect(codeCell.props.maxWidth).toBe("120px");

    const paysCell = paysCol.cell({ country_code: "FR" });
    expect(paysCell.props.value).toBe("FR");
    expect(paysCell.props.maxWidth).toBe("100px");

    const emailCell = emailCol.cell({ email: "test@example.com" });
    expect(emailCell.props.value).toBe("test@example.com");
    expect(emailCell.props.maxWidth).toBe("200px");

    const phoneCell = phoneCol.cell({ phone: "0102030405" });
    expect(phoneCell.props.value).toBe("0102030405");
    expect(phoneCell.props.maxWidth).toBe("120px");
  });
});