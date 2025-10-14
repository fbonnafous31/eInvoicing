// frontend/src/App.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

// 👇 Mocks
vi.mock("./components/layout/NavBar.jsx", () => ({ default: () => <nav>NavBar Mock</nav> }));
vi.mock("./LoginPage.jsx", () => ({ default: () => <div>LoginPage Mock</div> }));

// Mock react-pdf pour éviter l'erreur DOMMatrix
vi.mock("react-pdf", () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>PDF Page Mock</div>,
  pdfjs: { GlobalWorkerOptions: {} },
}));

// Mock PrivateRoute pour simplifier les tests
vi.mock("./components/auth/PrivateRoute.jsx", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe("App", () => {
  it("rend la page de login sur /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/LoginPage Mock/i)).toBeInTheDocument();
    // ❌ Pas de NavBar attendu sur /login
  });

  it("rend le NavBar sur une route protégée", () => {
    render(
      <MemoryRouter initialEntries={["/sellers"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/NavBar Mock/i)).toBeInTheDocument();
  });
});
