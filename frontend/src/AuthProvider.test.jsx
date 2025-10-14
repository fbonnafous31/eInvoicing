import React from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import AuthProvider from "./AuthProvider.jsx";

// ---------------- Mocks ----------------
vi.mock("@auth0/auth0-react", () => ({
  Auth0Provider: ({ children }) => (
    <div data-testid="auth0-provider">{children}</div>
  ),
}));

// Mock complet de react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AuthProvider", () => {
  const CHILD_CONTENT = <div>Child Content</div>;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rend Auth0Provider quand les variables sont présentes", () => {
    // ✅ Mock des variables d'environnement
    vi.stubEnv("VITE_AUTH0_DOMAIN", "domain.test");
    vi.stubEnv("VITE_AUTH0_CLIENT_ID", "client.test");
    vi.stubEnv("VITE_AUTH0_AUDIENCE", "audience.test");

    const { getByTestId } = render(<AuthProvider>{CHILD_CONTENT}</AuthProvider>);

    expect(getByTestId("auth0-provider")).toBeInTheDocument();
    expect(getByTestId("auth0-provider")).toHaveTextContent("Child Content");
  });

  it("onRedirectCallback utilise navigate avec returnTo ou /", () => {
    vi.stubEnv("VITE_AUTH0_DOMAIN", "domain.test");
    vi.stubEnv("VITE_AUTH0_CLIENT_ID", "client.test");
    vi.stubEnv("VITE_AUTH0_AUDIENCE", "audience.test");

    const { getByTestId } = render(<AuthProvider>{CHILD_CONTENT}</AuthProvider>);

    // Simule le callback
    const callback = (appState) => {
      mockNavigate(appState?.returnTo || "/");
    };

    callback({ returnTo: "/test" });
    expect(mockNavigate).toHaveBeenCalledWith("/test");

    callback({});
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
