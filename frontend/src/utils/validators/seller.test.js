import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateSeller } from "@/utils/validators/seller";
import * as siretValidator from "@/utils/validators/siret";
import * as contactValidator from "@/utils/validators/contact";
import * as postalCodeValidator from "@/utils/validators/postal_code";
import IBAN from "iban";

describe("validateSeller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Mocks
  const isValidSiretSpy = vi.spyOn(siretValidator, "isValidSiret");
  const validateContactSpy = vi.spyOn(contactValidator, "validateContact");
  const isValidPostalCodeSpy = vi.spyOn(postalCodeValidator, "isValidPostalCode");

  validateContactSpy.mockReturnValue({}); // par défaut aucune erreur de contact
  isValidPostalCodeSpy.mockReturnValue(true);

  // --- ENTREPRISE FR
  it("signale les champs légaux manquants et SIRET absent", () => {
    const data = { country_code: "FR" };
    isValidSiretSpy.mockReturnValue(true);

    const errors = validateSeller(data);
    expect(errors).toHaveProperty("legal_name", "Le nom légal est obligatoire");
    expect(errors).toHaveProperty(
      "legal_identifier",
      "Le SIRET est requis pour une entreprise française"
    );
  });

  it("signale un SIRET trop court", () => {
    const data = { country_code: "FR", legal_name: "Ma société", legal_identifier: "1234" };
    const errors = validateSeller(data);
    expect(errors).toHaveProperty("legal_identifier", "Le SIRET doit contenir 14 chiffres");
  });

  it("signale un SIRET invalide", () => {
    isValidSiretSpy.mockReturnValue(false);
    const data = { country_code: "FR", legal_name: "Ma société", legal_identifier: "12345678901234" };
    const errors = validateSeller(data);
    expect(errors).toHaveProperty("legal_identifier", "SIRET invalide");
  });

  it("ne retourne pas d'erreur si SIRET valide", () => {
    isValidSiretSpy.mockReturnValue(true);
    const data = {
      country_code: "FR",
      legal_name: "Ma société",
      legal_identifier: "12345678901234",
      address: "Adresse",
      postal_code: "75000",
      city: "Paris",
    };
    const errors = validateSeller(data);
    expect(errors).toEqual({});
  });

  // --- ENTREPRISE HORS FR
  it("signale l'absence de TVA pour une entreprise non française", () => {
    const data = { country_code: "DE", legal_name: "Meine Firma" };
    const errors = validateSeller(data);
    expect(errors).toHaveProperty("vat_number", "Le numéro de TVA intracommunautaire est requis");
  });

  it("n’a pas d’erreur si TVA fournie pour UE", () => {
    const data = {
      country_code: "BE",
      legal_name: "Ma société belge",
      vat_number: "BE0123456789",
      legal_identifier: "12345678901234",
      address: "Rue Exemple 1",
      postal_code: "1000",
      city: "Bruxelles"
    };
    const errors = validateSeller(data);
    expect(errors).toEqual({});
  });

  // --- ADRESSE
  it("signale les champs adresse obligatoires manquants", () => {
    const data = {
      country_code: "FR",
      legal_name: "Société",
      legal_identifier: "12345678901234"
    };
    isValidSiretSpy.mockReturnValue(true);

    const errors = validateSeller(data);
    expect(errors).toHaveProperty("address", "L’adresse est obligatoire");
    expect(errors).toHaveProperty("postal_code", "Le code postal est obligatoire");
    expect(errors).toHaveProperty("city", "La ville est obligatoire");
  });

  it("signale un code postal invalide", () => {
    const data = {
      country_code: "FR",
      legal_name: "Société",
      legal_identifier: "12345678901234",
      address: "Adresse",
      postal_code: "abc",
      city: "Paris"
    };
    isValidSiretSpy.mockReturnValue(true);
    isValidPostalCodeSpy.mockReturnValue(false);

    const errors = validateSeller(data);
    expect(errors).toHaveProperty("postal_code", "Code postal invalide");
  });

  // --- BANQUE
  it("signale un IBAN invalide", () => {
    const data = { legal_name: "Société", legal_identifier: "12345678901234", iban: "INVALIDIBAN", address: "Adresse", postal_code: "75000", city: "Paris" };
    isValidSiretSpy.mockReturnValue(true);
    const errors = validateSeller(data);
    expect(errors).toHaveProperty("iban", "IBAN invalide");
  });

  it("signale un BIC invalide", () => {
    const data = { legal_name: "Société", legal_identifier: "12345678901234", bic: "123", address: "Adresse", postal_code: "75000", city: "Paris" };
    isValidSiretSpy.mockReturnValue(true);
    const errors = validateSeller(data);
    expect(errors).toHaveProperty("bic", "BIC invalide");
  });

  // --- CONTACT
  it("inclut les erreurs de contact et du téléphone", () => {
    validateContactSpy.mockReturnValue({ contact_email: "Email invalide" });
    const data = {
      legal_name: "Société",
      legal_identifier: "12345678901234",
      address: "Adresse",
      postal_code: "75000",
      city: "Paris",
      contact_email: "bademail",
      phone_number: "123"
    };
    const errors = validateSeller(data);
    expect(errors).toHaveProperty("contact_email", "Email invalide");
    expect(errors).toHaveProperty("phone_number", "Numéro de téléphone invalide");
  });

  it("ne retourne aucune erreur si tout est valide", () => {
    validateContactSpy.mockReturnValue({});
    isValidSiretSpy.mockReturnValue(true);
    isValidPostalCodeSpy.mockReturnValue(true);
    const data = {
      country_code: "FR",
      legal_name: "Société",
      legal_identifier: "12345678901234",
      address: "75000 Paris",
      postal_code: "75000",
      city: "Paris",
      iban: "FR7630006000011234567890189",
      bic: "AGRIFRPP",
      contact_email: "test@test.com",
      phone_number: "+33612345678"
    };
    const errors = validateSeller(data);
    expect(errors).toEqual({});
  });
});
