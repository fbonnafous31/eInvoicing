// frontend/src/__tests__/AuthTest.test.jsx
import { render, screen } from "@testing-library/react";
import AuthTest from "../pages/AuthTest";
import { useAuth0 } from "@auth0/auth0-react";
import { vi } from "vitest";

// Mock des boutons pour simplifier les tests
vi.mock("../components/auth/LoginButton", () => ({
  LoginButton: () => <button data-testid="login-btn">Login</button>,
}));
vi.mock("../components/auth/LogoutButton", () => ({
  LogoutButton: () => <button data-testid="logout-btn">Logout</button>,
}));

// Mock du hook Auth0
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(),
}));

describe("AuthTest", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("affiche 'Chargement...' quand isLoading=true", () => {
    useAuth0.mockReturnValue({ isLoading: true });
    render(<AuthTest />);
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("affiche LoginButton si non authentifié", () => {
    useAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    });
    render(<AuthTest />);
    expect(screen.getByTestId("login-btn")).toBeInTheDocument();
  });

  it("affiche le message de bienvenue et LogoutButton si authentifié", () => {
    useAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { name: "François", email: "francois@test.com" },
    });
    render(<AuthTest />);
    expect(screen.getByText(/Bienvenue, François/i)).toBeInTheDocument();
    expect(screen.getByText(/\(francois@test.com\)/i)).toBeInTheDocument();
    expect(screen.getByTestId("logout-btn")).toBeInTheDocument();
  });
});
