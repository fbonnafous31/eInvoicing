// tests/validators/siret.test.js
import { describe, it, expect } from "vitest";
import { isValidSiret } from "@/utils/validators/siret";

describe("isValidSiret", () => {
  it("retourne false si le format est invalide (pas 14 chiffres)", () => {
    expect(isValidSiret("123")).toBe(false);
    expect(isValidSiret("1234567890123a")).toBe(false);
  });

  it("retourne true pour un SIRET valide", () => {
    // Exemple de SIRET valide (généré via l’algorithme de Luhn)
    expect(isValidSiret("73282932000074")).toBe(true);
  });

  it("retourne false pour un SIRET invalide", () => {
    expect(isValidSiret("73282932000075")).toBe(false);
  });
});
