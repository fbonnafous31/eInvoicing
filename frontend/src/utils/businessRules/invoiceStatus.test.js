// frontend/src/utils/businessRules/invoiceStatus.test.js
import { describe, it, expect } from "vitest";
import { canSendInvoice } from "./invoiceStatus"; // ← chemin relatif corrigé

describe("canSendInvoice", () => {
  it("retourne false si row est null ou undefined", () => {
    expect(canSendInvoice(null)).toBe(false);
    expect(canSendInvoice(undefined)).toBe(false);
  });

  it("retourne true si business_status est 'pending'", () => {
    expect(canSendInvoice({ business_status: "pending" })).toBe(true);
  });

  it("retourne true si business_status est '208'", () => {
    expect(canSendInvoice({ business_status: "208" })).toBe(true);
  });

  it("retourne true si technical_status est 'rejected'", () => {
    expect(canSendInvoice({ technical_status: "rejected" })).toBe(true);
  });

  it("retourne false si aucun statut ne correspond", () => {
    expect(
      canSendInvoice({ business_status: "sent", technical_status: "ok" })
    ).toBe(false);
  });

  it("retourne true si plusieurs conditions sont présentes", () => {
    expect(
      canSendInvoice({ business_status: "pending", technical_status: "rejected" })
    ).toBe(true);
  });
});
