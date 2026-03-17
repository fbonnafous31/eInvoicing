import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import SupportingDocs from "./SupportingDocs";
import { describe, it, beforeEach, vi, expect } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("fake-token"),
  }),
}));

const mockOnChange = vi.fn();

const sampleData = [
  { file_name: "facture.pdf", attachment_type: "main" },
  { file_name: "pièce1.pdf", attachment_type: "additional" },
];

describe("SupportingDocs", () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("rend le composant avec les fichiers existants", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    expect(screen.getByText(/facture.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/pièce1.pdf/i)).toBeInTheDocument();
  });

  it("supprime un justificatif principal", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    
    // On cherche l'élément qui contient le nom du fichier
    const mainFileRow = screen.getByText(/facture.pdf/i).closest('div');
    
    // On cherche le bouton de suppression UNIQUEMENT à l'intérieur de cet élément
    const deleteBtn = within(mainFileRow).getByRole("button");
    
    fireEvent.click(deleteBtn);

    expect(mockOnChange).toHaveBeenCalledWith([
      { file_name: "pièce1.pdf", attachment_type: "additional" },
    ]);
  });

  it("supprime un justificatif additionnel", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);

    // On cherche l'élément (li) qui contient le nom du fichier additionnel
    const additionalFileRow = screen.getByText(/pièce1.pdf/i).closest('li');
    
    // On cherche le bouton à l'intérieur de ce li
    const deleteBtn = within(additionalFileRow).getByRole("button");
    
    fireEvent.click(deleteBtn);

    expect(mockOnChange).toHaveBeenCalledWith([
      { file_name: "facture.pdf", attachment_type: "main" },
    ]);
  });
});