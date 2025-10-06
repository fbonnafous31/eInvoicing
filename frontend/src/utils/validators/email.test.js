import { describe, it, expect } from "vitest";
import { validateEmail, validateOptionalEmail } from "@/utils/validators/email";

describe("validateEmail", () => {
  it("retourne une erreur si l'email est vide", () => {
    expect(validateEmail("")).toBe("L'email est obligatoire");
    expect(validateEmail("   ")).toBe("L'email est obligatoire");
    expect(validateEmail(null)).toBe("L'email est obligatoire");
    expect(validateEmail(undefined)).toBe("L'email est obligatoire");
  });

  it("retourne une erreur si le format est invalide", () => {
    expect(validateEmail("abc")).toBe("Format d'email invalide");
    expect(validateEmail("abc@")).toBe("Format d'email invalide");
    expect(validateEmail("@test.com")).toBe("Format d'email invalide");
    expect(validateEmail("abc@test")).toBe("Format d'email invalide");
    expect(validateEmail("abc@@test.com")).toBe("Format d'email invalide");
  });

  it("retourne null pour un email valide", () => {
    expect(validateEmail("test@example.com")).toBeNull();
    expect(validateEmail("user.name+tag@sub.domain.co")).toBeNull();
  });
});

describe("validateOptionalEmail", () => {
  it("retourne null si l'email est vide (champ facultatif)", () => {
    expect(validateOptionalEmail("")).toBeNull();
    expect(validateOptionalEmail("   ")).toBeNull();
    expect(validateOptionalEmail(null)).toBeNull();
    expect(validateOptionalEmail(undefined)).toBeNull();
  });

  it("retourne une erreur si un email est renseigné mais invalide", () => {
    expect(validateOptionalEmail("abc")).toBe("Format d'email invalide");
    expect(validateOptionalEmail("abc@")).toBe("Format d'email invalide");
  });

  it("retourne null si l'email facultatif est valide", () => {
    expect(validateOptionalEmail("hello@world.com")).toBeNull();
  });
});
