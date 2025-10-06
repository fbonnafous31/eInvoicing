import { describe, it, expect, vi } from "vitest";
import { validateContact } from "@/utils/validators/contact";
import * as emailValidator from "@/utils/validators/email";

describe("validateContact", () => {
  // Mock des fonctions email pour isoler les tests
  const validateEmailSpy = vi.spyOn(emailValidator, "validateEmail");
  const validateOptionalEmailSpy = vi.spyOn(emailValidator, "validateOptionalEmail");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne un objet vide si email facultatif et téléphone valide", () => {
    validateOptionalEmailSpy.mockReturnValue(null);
    const data = { email: "", phone: "+33612345678" };
    const result = validateContact(data);
    expect(result).toEqual({});
  });

  it("retourne une erreur d'email si email requis et invalide", () => {
    validateEmailSpy.mockReturnValue("L'email est obligatoire");
    const data = { email: "", phone: "" };
    const result = validateContact(data, { emailRequired: true });
    expect(result).toEqual({ email: "L'email est obligatoire" });
  });

  it("retourne une erreur d'email si email facultatif mais mal formé", () => {
    validateOptionalEmailSpy.mockReturnValue("Format d'email invalide");
    const data = { email: "abc@", phone: "" };
    const result = validateContact(data);
    expect(result).toEqual({ email: "Format d'email invalide" });
  });

  it("retourne une erreur de téléphone si invalide", () => {
    validateOptionalEmailSpy.mockReturnValue(null);
    const data = { email: "ok@test.com", phone: "123" };
    const result = validateContact(data);
    expect(result).toEqual({ phone: "Numéro de téléphone invalide" });
  });

  it("retourne un objet vide si email et téléphone sont valides", () => {
    validateOptionalEmailSpy.mockReturnValue(null);
    const data = { email: "user@example.com", phone: "+33 6 12 34 56 78" };
    const result = validateContact(data);
    expect(result).toEqual({});
  });

  it("supporte les champs personnalisés", () => {
    validateOptionalEmailSpy.mockReturnValue(null);
    const data = { contact_email: "ok@ex.com", contact_phone: "123" };
    const result = validateContact(data, {
      emailField: "contact_email",
      phoneField: "contact_phone",
    });
    expect(result).toHaveProperty("contact_phone", "Numéro de téléphone invalide");
  });

  it("appelle la bonne fonction selon emailRequired", () => {
    const data = { email: "test@ok.com" };
    validateContact(data, { emailRequired: true });
    expect(validateEmailSpy).toHaveBeenCalled();

    validateContact(data, { emailRequired: false });
    expect(validateOptionalEmailSpy).toHaveBeenCalled();
  });
});
