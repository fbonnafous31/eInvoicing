// src/components/layout/Breadcrumb.test.jsx
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";

describe("Breadcrumb", () => {
  const items = [
    { label: "Accueil", path: "/" },
    { label: "Factures", path: "/invoices" },
    { label: "Facture 001", path: "/invoices/1" },
  ];

  it("rend tous les items correctement", () => {
    render(
      <BrowserRouter>
        <Breadcrumb items={items} />
      </BrowserRouter>
    );

    // Vérifie que chaque item est présent
    items.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });

    // Vérifie le dernier item
    const lastItemLi = screen.getByText(items[items.length - 1].label).closest("li");
    expect(lastItemLi).toHaveClass("active");
    expect(lastItemLi).toHaveClass("breadcrumb-item");

    // Les autres items doivent être des liens
    items.slice(0, -1).forEach((item) => {
      const link = screen.getByText(item.label).closest("a");
      expect(link).toHaveAttribute("href", item.path);
    });
  });
});
