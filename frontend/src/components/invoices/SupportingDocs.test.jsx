// src/components/invoices/SupportingDocs.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SupportingDocs from "./SupportingDocs";
import { describe, it, beforeEach, vi, expect } from "vitest";

// 🔹 Mock useAuth pour Vitest
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
    expect(screen.getByText("facture.pdf")).toBeInTheDocument();
    expect(screen.getByText("pièce1.pdf")).toBeInTheDocument();
  });

  it("supprime un justificatif principal", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    const deleteBtn = screen.getAllByRole("button")[0]; // premier bouton = main
    fireEvent.click(deleteBtn);
    expect(mockOnChange).toHaveBeenCalledWith([
      { file_name: "pièce1.pdf", attachment_type: "additional" },
    ]);
  });

  it("supprime un justificatif additionnel", () => {
    render(<SupportingDocs data={sampleData} onChange={mockOnChange} />);
    const deleteBtn = screen.getAllByRole("button")[1]; // deuxième bouton = additional
    fireEvent.click(deleteBtn);
    expect(mockOnChange).toHaveBeenCalledWith([
      { file_name: "facture.pdf", attachment_type: "main" },
    ]);
  });
});
