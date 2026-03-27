// AuthProvider.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AuthProvider from "./AuthProvider";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// On capture les props reçues par Auth0Provider pour les inspecter
let capturedAuth0Props = {};
let capturedOnRedirectCallback = null;

vi.mock("@auth0/auth0-react", () => ({
  Auth0Provider: (props) => {
    capturedAuth0Props = props;
    capturedOnRedirectCallback = props.onRedirectCallback;
    return <div data-testid="auth0-provider">{props.children}</div>;
  },
}));

// Mock getEnv pour contrôler précisément les valeurs retournées
const mockGetEnv = vi.fn();
vi.mock("./utils/getEnv", () => ({
  getEnv: () => mockGetEnv(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ENV = {
  VITE_AUTH0_DOMAIN: "test.auth0.com",
  VITE_AUTH0_CLIENT_ID: "client-123",
  VITE_AUTH0_AUDIENCE: "https://api.test",
};

function renderProvider(envOverrides = {}) {
  mockGetEnv.mockReturnValue({ ...VALID_ENV, ...envOverrides });
  return render(<AuthProvider><div data-testid="child">Child</div></AuthProvider>);
}

// ---------------------------------------------------------------------------
// 1. Rendu null si variables manquantes
// ---------------------------------------------------------------------------

describe("AuthProvider — variables d'environnement manquantes", () => {
  afterEach(() => vi.clearAllMocks());

  it("retourne null si VITE_AUTH0_DOMAIN est absent", () => {
    const { container } = renderProvider({ VITE_AUTH0_DOMAIN: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it("retourne null si VITE_AUTH0_CLIENT_ID est absent", () => {
    const { container } = renderProvider({ VITE_AUTH0_CLIENT_ID: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it("retourne null si VITE_AUTH0_AUDIENCE est absent", () => {
    const { container } = renderProvider({ VITE_AUTH0_AUDIENCE: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it("retourne null si toutes les variables sont absentes", () => {
    const { container } = renderProvider({
      VITE_AUTH0_DOMAIN: undefined,
      VITE_AUTH0_CLIENT_ID: undefined,
      VITE_AUTH0_AUDIENCE: undefined,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("retourne null si les variables sont des chaînes vides", () => {
    const { container } = renderProvider({
      VITE_AUTH0_DOMAIN: "",
      VITE_AUTH0_CLIENT_ID: "",
      VITE_AUTH0_AUDIENCE: "",
    });
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// 2. Rendu nominal
// ---------------------------------------------------------------------------

describe("AuthProvider — rendu nominal", () => {
  afterEach(() => vi.clearAllMocks());

  it("rend Auth0Provider si toutes les variables sont présentes", () => {
    renderProvider();
    expect(screen.getByTestId("auth0-provider")).toBeInTheDocument();
  });

  it("rend les enfants à l'intérieur d'Auth0Provider", () => {
    renderProvider();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("ne rend pas les enfants si les variables sont manquantes", () => {
    renderProvider({ VITE_AUTH0_DOMAIN: undefined });
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Props passées à Auth0Provider
// ---------------------------------------------------------------------------

describe("AuthProvider — props transmises à Auth0Provider", () => {
  afterEach(() => vi.clearAllMocks());

  it("passe le domain correct", () => {
    renderProvider();
    expect(capturedAuth0Props.domain).toBe(VALID_ENV.VITE_AUTH0_DOMAIN);
  });

  it("passe le clientId correct", () => {
    renderProvider();
    expect(capturedAuth0Props.clientId).toBe(VALID_ENV.VITE_AUTH0_CLIENT_ID);
  });

  it("passe l'audience dans authorizationParams", () => {
    renderProvider();
    expect(capturedAuth0Props.authorizationParams?.audience).toBe(VALID_ENV.VITE_AUTH0_AUDIENCE);
  });

  it("passe window.location.origin comme redirect_uri", () => {
    renderProvider();
    expect(capturedAuth0Props.authorizationParams?.redirect_uri).toBe(window.location.origin);
  });

  it('passe cacheLocation="memory"', () => {
    renderProvider();
    expect(capturedAuth0Props.cacheLocation).toBe("memory");
  });

  it("passe useRefreshTokens=false", () => {
    renderProvider();
    expect(capturedAuth0Props.useRefreshTokens).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. onRedirectCallback — via le vrai callback capturé
// ---------------------------------------------------------------------------

describe("AuthProvider — onRedirectCallback", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    capturedOnRedirectCallback = null;
  });

  afterEach(() => vi.clearAllMocks());

  it("navigue vers appState.returnTo si défini", () => {
    renderProvider();
    capturedOnRedirectCallback({ returnTo: "/dashboard" });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it('navigue vers "/" si appState.returnTo est absent', () => {
    renderProvider();
    capturedOnRedirectCallback({});
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it('navigue vers "/" si appState est undefined', () => {
    renderProvider();
    capturedOnRedirectCallback(undefined);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it('navigue vers "/" si appState est null', () => {
    renderProvider();
    capturedOnRedirectCallback(null);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("appelle navigate exactement une fois par callback", () => {
    renderProvider();
    capturedOnRedirectCallback({ returnTo: "/profil" });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});