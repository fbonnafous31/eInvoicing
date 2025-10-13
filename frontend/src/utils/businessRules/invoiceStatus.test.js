// frontend/src/utils/businessRules/invoiceStatus.test.js
import { describe, it, expect } from "vitest";
import { canSendInvoice } from "./invoiceStatus"; // chemin relatif

describe("canSendInvoice", () => {
  it("retourne false si row est null ou undefined", () => {
    expect(canSendInvoice(null)).toBe(false);
    expect(canSendInvoice(undefined)).toBe(false);
  });

  it("retourne true si technical_status est 'pending'", () => {
    expect(canSendInvoice({ technical_status: "pending" })).toBe(true);
  });

  it("retourne true si technical_status est 'rejected'", () => {
    expect(canSendInvoice({ technical_status: "rejected" })).toBe(true);
  });

  it("retourne false si technical_status est autre chose", () => {
    expect(canSendInvoice({ technical_status: "validated" })).toBe(false);
    expect(canSendInvoice({ technical_status: "completed" })).toBe(false);
  });

  it("retourne true si plusieurs conditions techniques sont présentes", () => {
    expect(
      canSendInvoice({ technical_status: "pending", other_field: "value" })
    ).toBe(true);
  });
});
