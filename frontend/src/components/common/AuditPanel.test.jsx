import { render, screen } from "@testing-library/react";
import AuditPanel from "./AuditPanel";

describe("AuditPanel", () => {
  it("affiche correctement les dates valides", () => {
    const createdAt = "2025-10-06T12:34:56Z";
    const updatedAt = "2025-10-06T15:00:00Z";
    render(<AuditPanel createdAt={createdAt} updatedAt={updatedAt} />);

    expect(screen.getByText(/Créé le/)).toBeTruthy();
    expect(screen.getByText(/Mis à jour le/)).toBeTruthy();
  });

  it("affiche '—' si les dates sont manquantes ou invalides", () => {
    render(<AuditPanel createdAt={null} updatedAt="invalid-date" />);
    expect(screen.getByText("Créé le — à —")).toBeTruthy();
    expect(screen.getByText("Mis à jour le — à —")).toBeTruthy();
  });
});
