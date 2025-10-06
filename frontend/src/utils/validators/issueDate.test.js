import { describe, it, expect, vi } from "vitest";
import { validateIssueDate } from "@/utils/validators/issueDate";

describe("validateIssueDate", () => {
  // Figer la date d'aujourd'hui pour des tests stables
  const fixedToday = new Date("2025-10-06");
  vi.setSystemTime(fixedToday);

  it("retourne null si la date est vide (non obligatoire)", () => {
    expect(validateIssueDate("")).toBeNull();
    expect(validateIssueDate(null)).toBeNull();
    expect(validateIssueDate(undefined)).toBeNull();
  });

  it("retourne une erreur si la date est invalide", () => {
    expect(validateIssueDate("abc")).toBe("Date d'émission invalide");
    expect(validateIssueDate("32/13/2024")).toBe("Date d'émission invalide");
    expect(validateIssueDate("2025-15-40")).toBe("Date d'émission invalide");
  });

  it("retourne une erreur si la date est trop ancienne (plus d'un an avant)", () => {
    expect(validateIssueDate("2024-09-30")).toBe(
      "Date d'émission hors limites recommandées (±1 an par rapport à aujourd'hui)"
    );
  });

  it("retourne une erreur si la date est trop future (plus d'un an après)", () => {
    expect(validateIssueDate("2026-10-10")).toBe(
      "Date d'émission hors limites recommandées (±1 an par rapport à aujourd'hui)"
    );
  });

  it("retourne null pour une date valide dans la fenêtre d'un an", () => {
    expect(validateIssueDate("2025-04-01")).toBeNull(); // dans les 6 derniers mois
    expect(validateIssueDate("2026-09-30")).toBeNull(); // dans les 12 prochains mois
  });
});
