// frontend/src/LoginPage.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import LoginPage from "./LoginPage.jsx";

// ---------------- Mock useAuth0 ----------------
const mockLoginWithRedirect = vi.fn();
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    loginWithRedirect: mockLoginWithRedirect,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le texte et le bouton login par défaut", () => {
    render(<LoginPage />);

    expect(screen.getByText(/Connectez-vous pour accéder/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Se connecter/i })).toBeInTheDocument();
    expect(screen.getByText(/Pas encore de compte \?/i)).toBeInTheDocument();
  });

  it("change le texte et le bouton lorsqu'on clique sur le lien s'inscrire", () => {
    render(<LoginPage />);

    const toggleLink = screen.getByText(/S'inscrire/i);
    fireEvent.click(toggleLink);

    expect(screen.getByText(/Créez votre compte et commencez/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /S'inscrire/i })).toBeInTheDocument();
    expect(screen.getByText(/Déjà un compte \?/i)).toBeInTheDocument();
  });

  it("appelle loginWithRedirect avec les bonnes variables pour login", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    const env = import.meta.env; // récupère l'env Vite
    expect(mockLoginWithRedirect).toHaveBeenCalledWith({
      screen_hint: "login",
      authorizationParams: {
        audience: env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      },
    });
  });

  it("appelle loginWithRedirect avec les bonnes variables pour signup", () => {
    render(<LoginPage />);

    // On clique pour passer en mode signup
    fireEvent.click(screen.getByText(/S'inscrire/i));
    fireEvent.click(screen.getByRole("button", { name: /S'inscrire/i }));

    const env = import.meta.env;
    expect(mockLoginWithRedirect).toHaveBeenCalledWith({
      screen_hint: "signup",
      authorizationParams: {
        audience: env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      },
    });
  });
});
