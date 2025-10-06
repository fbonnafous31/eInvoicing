import { describe, it, expect } from "vitest";
import {
  validateInvoiceField,
  validateInvoiceLine,
  validateClientData,
} from "@/utils/validators/invoice";

describe("validateInvoiceField", () => {
  const currentYear = new Date().getFullYear();

  it("retourne une erreur pour les champs obligatoires manquants", () => {
    expect(validateInvoiceField("invoice_number", "")).toBe("Ce champ est obligatoire.");
    expect(validateInvoiceField("issue_date", "")).toBe("Ce champ est obligatoire");
    expect(validateInvoiceField("seller_id", null)).toBe("Ce champ est obligatoire");
    expect(validateInvoiceField("client_id", undefined)).toBe("Ce champ est obligatoire");
  });

  it("retourne une erreur si fiscal_year hors limites", () => {
    const data = { issue_date: `${currentYear}-01-01` };
    expect(validateInvoiceField("fiscal_year", currentYear - 2, data)).toBe(
      `L’exercice fiscal doit être compris entre ${currentYear - 1} et ${currentYear + 1}`
    );
    expect(validateInvoiceField("fiscal_year", currentYear + 2, data)).toBe(
      `L’exercice fiscal doit être compris entre ${currentYear - 1} et ${currentYear + 1}`
    );
  });

  it("ne retourne pas d'erreur pour fiscal_year valide", () => {
    const data = { issue_date: `${currentYear}-01-01` };
    expect(validateInvoiceField("fiscal_year", currentYear, data)).toBeUndefined();
  });

  it("ne retourne pas d'erreur pour un champ non concerné", () => {
    expect(validateInvoiceField("some_other_field", "value")).toBeUndefined();
  });
});

describe("validateInvoiceLine", () => {
  it("retourne des erreurs pour tous les champs manquants ou invalides", () => {
    const errors = validateInvoiceLine({});
    expect(errors).toHaveProperty("description", "Ce champ est obligatoire");
    expect(errors).toHaveProperty("quantity", "Quantité obligatoire");
    expect(errors).toHaveProperty("unit_price", "Prix unitaire obligatoire");
  });

  it("retourne des erreurs pour quantité et prix invalides", () => {
    const line = { description: "Produit", quantity: -1, unit_price: -5 };
    const errors = validateInvoiceLine(line);
    expect(errors).toHaveProperty("quantity", "Quantité invalide");
    expect(errors).toHaveProperty("unit_price", "Prix unitaire invalide");
  });

  it("retourne des erreurs pour remise et TVA invalides", () => {
    const line = { description: "Produit", quantity: 1, unit_price: 10, discount: -1, vat_rate: -20 };
    const errors = validateInvoiceLine(line);
    expect(errors).toHaveProperty("discount", "Remise invalide");
    expect(errors).toHaveProperty("vat_rate", "Taux TVA invalide");
  });

  it("ne retourne aucune erreur si la ligne est correcte", () => {
    const line = { description: "Produit", quantity: 1, unit_price: 10, discount: 0, vat_rate: 20 };
    const errors = validateInvoiceLine(line);
    expect(errors).toEqual({});
  });
});

describe("validateClientData", () => {
  it("retourne les erreurs pour un particulier incomplet", () => {
    const data = { client_type: "individual" };
    expect(validateClientData("client_first_name", data)).toBe("Prénom obligatoire");
    expect(validateClientData("client_last_name", data)).toBe("Nom obligatoire");
    expect(validateClientData("client_address", data)).toBe("Adresse obligatoire");
  });

  it("retourne les erreurs pour une entreprise française incomplète", () => {
    const data = { client_type: "company_fr" };
    expect(validateClientData("client_siret", data)).toBe("SIRET obligatoire");
    expect(validateClientData("client_legal_name", data)).toBe("Raison sociale obligatoire");
    expect(validateClientData("client_address", data)).toBe("Adresse obligatoire");
  });

  it("retourne les erreurs pour une entreprise UE incomplète", () => {
    const data = { client_type: "company_eu" };
    expect(validateClientData("client_vat_number", data)).toBe("TVA intracommunautaire obligatoire");
    expect(validateClientData("client_legal_name", data)).toBe("Raison sociale obligatoire");
    expect(validateClientData("client_address", data)).toBe("Adresse obligatoire");
  });

  it("ne retourne pas d'erreur pour des données valides", () => {
    const data = {
      client_type: "company_fr",
      client_siret: "12345678901234",
      client_legal_name: "Ma société",
      client_address: "75000 Paris",
    };
    expect(validateClientData("client_siret", data)).toBe("");
    expect(validateClientData("client_legal_name", data)).toBe("");
    expect(validateClientData("client_address", data)).toBe("");
  });

  it("retourne une chaîne vide pour un champ non concerné", () => {
    const data = { client_type: "individual" };
    expect(validateClientData("unknown_field", data)).toBe("");
  });
});
