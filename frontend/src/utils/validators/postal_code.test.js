import { describe, it, expect } from "vitest";
import { isValidPostalCode } from "@/utils/validators/postal_code";

describe("isValidPostalCode", () => {
  it("retourne true si le code postal est vide (non obligatoire)", () => {
    expect(isValidPostalCode("")).toBe(true);
    expect(isValidPostalCode(null)).toBe(true);
    expect(isValidPostalCode(undefined)).toBe(true);
  });

  it("retourne true pour un code postal français valide", () => {
    expect(isValidPostalCode("01000")).toBe(true);
    expect(isValidPostalCode("75001")).toBe(true);
    expect(isValidPostalCode("99999")).toBe(true);
  });

  it("retourne false pour un code postal avec un mauvais format", () => {
    expect(isValidPostalCode("ABCDE")).toBe(false);
    expect(isValidPostalCode("1234")).toBe(false);
    expect(isValidPostalCode("123456")).toBe(false);
    expect(isValidPostalCode("12 345")).toBe(false);
    expect(isValidPostalCode("75-001")).toBe(false);
  });

  it("retourne false pour des valeurs non numériques", () => {
    expect(isValidPostalCode("7500A")).toBe(false);
    expect(isValidPostalCode("75O01")).toBe(false); // O majuscule au lieu de 0
  });
});
