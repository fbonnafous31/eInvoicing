import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateClient } from "@/utils/validators/client";
import * as siretValidator from "@/utils/validators/siret";
import * as contactValidator from "@/utils/validators/contact";
import * as postalCodeValidator from "@/utils/validators/postal_code";

describe("validateClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- mocks
  const isValidSiretSpy = vi.spyOn(siretValidator, "isValidSiret");
  const validateContactSpy = vi.spyOn(contactValidator, "validateContact");
  const isValidPostalCodeSpy = vi.spyOn(postalCodeValidator, "isValidPostalCode");

  validateContactSpy.mockReturnValue({});

  // --- ENTREPRISE FR
  it("signale les champs obligatoires manquants pour une entreprise française", () => {
    const data = { country_code: "FR", is_company: true };
    isValidSiretSpy.mockReturnValue(true);

    const errors = validateClient(data);

    expect(errors).toHaveProperty("legal_name", "Le nom légal est obligatoire");
    expect(errors).toHaveProperty("siret", "Le SIRET est requis pour une entreprise française");
  });

  it("signale un SIRET trop court", () => {
    const data = {
      country_code: "FR",
      is_company: true,
      legal_name: "Ma société",
      siret: "1234",
    };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("siret", "Le SIRET doit contenir 14 chiffres");
  });

  it("signale un SIRET invalide", () => {
    isValidSiretSpy.mockReturnValue(false);
    const data = {
      country_code: "FR",
      is_company: true,
      legal_name: "Ma société",
      siret: "12345678901234",
    };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("siret", "SIRET invalide");
  });

  it("ne renvoie pas d’erreur si l’entreprise française est valide", () => {
    isValidSiretSpy.mockReturnValue(true);
    const data = {
      country_code: "FR",
      is_company: true,
      legal_name: "Ma société",
      siret: "12345678901234",
      email: "ok@test.com",
      postal_code: "75000",
    };
    isValidPostalCodeSpy.mockReturnValue(true);
    const errors = validateClient(data);
    expect(errors).toEqual({});
  });

  // --- ENTREPRISE HORS FR
  it("signale l’absence de TVA pour une entreprise non française", () => {
    const data = {
      country_code: "DE",
      is_company: true,
      legal_name: "Meine Firma",
    };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("vat_number", "Le numéro de TVA intracommunautaire est requis");
  });

  it("n’a pas d’erreur si entreprise étrangère avec TVA", () => {
    const data = {
      country_code: "BE",
      is_company: true,
      legal_name: "Ma société belge",
      vat_number: "BE0123456789",
    };
    const errors = validateClient(data);
    expect(errors).toEqual({});
  });

  // --- PARTICULIER
  it("signale les champs obligatoires pour un particulier", () => {
    const data = { is_company: false, country_code: "FR" };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("firstname", "Le prénom est obligatoire");
    expect(errors).toHaveProperty("lastname", "Le nom est obligatoire");
  });

  it("signale une erreur si un particulier a un SIRET", () => {
    const data = { is_company: false, siret: "12345678901234" };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("siret", "Un particulier ne peut pas avoir de SIRET");
  });

  it("n’a pas d’erreur si particulier complet et sans SIRET", () => {
    const data = {
      is_company: false,
      firstname: "Jean",
      lastname: "Dupont",
      email: "jean@test.com",
    };
    const errors = validateClient(data);
    expect(errors).toEqual({});
  });

  // --- CONTACT
  it("inclut les erreurs de contact", () => {
    validateContactSpy.mockReturnValue({ email: "Format d'email invalide" });
    const data = {
      country_code: "FR",
      is_company: true,
      legal_name: "Ma société",
      siret: "12345678901234",
      email: "bademail",
    };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("email", "Format d'email invalide");
  });

  // --- POSTAL CODE
  it("signale un code postal invalide pour la France", () => {
    isValidPostalCodeSpy.mockReturnValue(false);
    const data = {
      country_code: "FR",
      is_company: true,
      legal_name: "Ma société",
      siret: "12345678901234",
      postal_code: "7500",
    };
    const errors = validateClient(data);
    expect(errors).toHaveProperty("postal_code", "Le code postal doit contenir 5 chiffres");
  });
});
