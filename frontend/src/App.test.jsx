// frontend/src/App.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("./components/layout/NavBar.jsx", () => ({
  default: () => <nav data-testid="navbar">NavBar Mock</nav>,
}));

vi.mock("./LoginPage.jsx", () => ({
  default: () => <div data-testid="login-page">LoginPage Mock</div>,
}));

vi.mock("react-pdf", () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>PDF Page Mock</div>,
  pdfjs: { GlobalWorkerOptions: {} },
}));

vi.mock("./components/auth/PrivateRoute.jsx", () => ({
  default: ({ children }) => <div data-testid="private-route">{children}</div>,
}));

// On intercepte le Layout pour capturer la prop fluid
vi.mock("./App.jsx", async () => {
  const actual = await vi.importActual("./App.jsx");
  return actual; // on utilise le vrai App — on inspecte le DOM
});

// Mock des routes applicatives pour contrôler précisément ce qui est rendu
vi.mock("./AppRoutes.jsx", () => ({
  default: [
    { path: "/",             element: <div data-testid="page-home">Home</div> },
    { path: "/clients",      element: <div data-testid="page-clients">Clients</div> },
    { path: "/sellers",      element: <div data-testid="page-sellers">Sellers</div> },
    { path: "/invoices",     element: <div data-testid="page-invoices">Invoices</div> },
    { path: "/invoices/:id", element: <div data-testid="page-invoice-detail">Invoice Detail</div> },
    { path: "/invoices/:id/view", element: <div data-testid="page-invoice-view">Invoice View</div> },
    { path: "/login",        element: <div data-testid="route-login-ignored">Should be ignored</div> },
  ],
}));

// ---------------------------------------------------------------------------
// Helper — inspecte si le container principal a la classe fluid
// ---------------------------------------------------------------------------

function getMainElement() {
  return document.querySelector("main");
}

function isFluid(mainEl) {
  return mainEl?.classList.contains("container-fluid");
}

function isNarrow(mainEl) {
  return mainEl?.classList.contains("container") && !mainEl?.classList.contains("container-fluid");
}

// ---------------------------------------------------------------------------
// 1. Route /login
// ---------------------------------------------------------------------------

describe("App — route /login", () => {
  it("rend LoginPage sur /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("n'affiche pas la NavBar sur /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("navbar")).not.toBeInTheDocument();
  });

  it("n'affiche pas PrivateRoute sur /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("private-route")).not.toBeInTheDocument();
  });

  it("n'affiche pas le contenu de la route /login définie dans AppRoutes", () => {
    // La route /login dans AppRoutes doit être ignorée (return null)
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("route-login-ignored")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Routes protégées — NavBar et PrivateRoute
// ---------------------------------------------------------------------------

describe("App — routes protégées", () => {
  it("affiche la NavBar sur /sellers", () => {
    render(
      <MemoryRouter initialEntries={["/sellers"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("enveloppe le contenu dans PrivateRoute sur une route protégée", () => {
    render(
      <MemoryRouter initialEntries={["/sellers"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId("private-route")).toBeInTheDocument();
  });

  it("rend le contenu de la route /sellers", () => {
    render(
      <MemoryRouter initialEntries={["/sellers"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-sellers")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Layout fluid=true — routes statiques larges
// ---------------------------------------------------------------------------

describe("App — Layout fluid (routes pleine largeur)", () => {
  const fullWidthRoutes = [
    { path: "/",        testId: "page-home" },
    { path: "/clients", testId: "page-clients" },
    { path: "/invoices",testId: "page-invoices" },
    // /sellers n'est pas dans fullWidthStaticRoutes
  ];

  it.each(fullWidthRoutes)(
    "utilise container-fluid sur $path",
    ({ path, testId }) => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      );

      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(isFluid(getMainElement())).toBe(true);
      unmount();
    }
  );

  it("utilise container-fluid sur /invoices/:id/view", () => {
    render(
      <MemoryRouter initialEntries={["/invoices/inv-42/view"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-invoice-view")).toBeInTheDocument();
    expect(isFluid(getMainElement())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Layout fluid=false — routes en largeur normale
// ---------------------------------------------------------------------------

describe("App — Layout non-fluid (routes largeur normale)", () => {
  it("utilise container (non-fluid) sur /invoices/:id (détail sans /view)", () => {
    render(
      <MemoryRouter initialEntries={["/invoices/inv-42"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-invoice-detail")).toBeInTheDocument();
    expect(isNarrow(getMainElement())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Route inconnue — pas de crash
// ---------------------------------------------------------------------------

describe("App — route inconnue", () => {
  it("ne plante pas sur une route non définie", () => {
    expect(() =>
      render(
        <MemoryRouter initialEntries={["/route-inexistante"]}>
          <App />
        </MemoryRouter>
      )
    ).not.toThrow();
  });

  it("n'affiche aucun contenu de page sur une route inconnue", () => {
    render(
      <MemoryRouter initialEntries={["/route-inexistante"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.queryByTestId(/^page-/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. Composant Layout — isolé
// ---------------------------------------------------------------------------

describe("Layout — composant isolé", () => {
  // On importe le composant Layout directement depuis App
  // comme il n'est pas exporté, on le teste via le rendu de App

  it("rend les enfants dans un container-fluid si fluid=true", () => {
    render(
      <MemoryRouter initialEntries={["/clients"]}>
        <App />
      </MemoryRouter>
    );
    const main = getMainElement();
    expect(main).toHaveClass("container-fluid");
    expect(main).toHaveClass("px-0");
    expect(main).toHaveClass("mt-4");
  });
});