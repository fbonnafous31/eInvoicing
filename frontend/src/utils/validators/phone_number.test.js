import { describe, it, expect } from "vitest";
import { validatePhoneNumber } from "@/utils/validators/phone_number";

describe("validatePhoneNumber", () => {
  it("retourne null si le champ est vide (non obligatoire)", () => {
    expect(validatePhoneNumber("")).toBeNull();
    expect(validatePhoneNumber(null)).toBeNull();
    expect(validatePhoneNumber(undefined)).toBeNull();
  });

  it("retourne un message d'erreur si le format est invalide", () => {
    expect(validatePhoneNumber("abc123")).toBe("Numéro de téléphone invalide");
    expect(validatePhoneNumber("12-34")).toBe("Numéro de téléphone invalide"); // trop court
    expect(validatePhoneNumber("+33 (0)1 23 45 67 89")).toBe("Numéro de téléphone invalide"); // parenthèses interdites
  });

  it("retourne null pour des formats valides", () => {
    expect(validatePhoneNumber("0612345678")).toBeNull();
    expect(validatePhoneNumber("+33612345678")).toBeNull();
    expect(validatePhoneNumber("+33 6 12 34 56 78")).toBeNull();
    expect(validatePhoneNumber("06-12-34-56-78")).toBeNull();
    expect(validatePhoneNumber("0044123456789")).toBeNull(); // format international sans +
  });

  it("refuse les chaînes trop longues", () => {
    const longNumber = "+33" + "1".repeat(30);
    expect(validatePhoneNumber(longNumber)).toBe("Numéro de téléphone invalide");
  });
});
