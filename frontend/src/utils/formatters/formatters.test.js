// src/utils/formatters/formatters.test.js
import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "../formatters/formatters";

describe("formatCurrency", () => {
  it("formate correctement un nombre en euros", () => {
    expect(formatCurrency(1234.56)).toBe("1 234,56 €");
    expect(formatCurrency("1234.56")).toBe("1 234,56 €");
  });

  it("retourne une chaîne vide si la valeur n'est pas un nombre", () => {
    expect(formatCurrency("abc")).toBe("");
    expect(formatCurrency(undefined)).toBe("");
    expect(formatCurrency(null)).toBe("");
    expect(formatCurrency("")).toBe("");
  });
});

describe("formatDate", () => {
  it("formate correctement une date valide", () => {
    expect(formatDate("2025-10-06")).toBe("06/10/2025");
    expect(formatDate(new Date(2025, 9, 6))).toBe("06/10/2025"); // mois 0-indexé
  });

  it("retourne une chaîne vide si la valeur est vide ou invalide", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("invalid-date")).toBe(""); 
    expect(formatDate("")).toBe("");
  });
});
