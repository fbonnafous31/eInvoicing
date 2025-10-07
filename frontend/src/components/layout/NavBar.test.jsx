import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import NavBar from "./NavBar";
import { vi } from "vitest";

// Mock Auth0
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    user: null,
  }),
}));

describe("NavBar", () => {
  it("affiche les liens principaux et le bouton login", () => {
    render(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );

    expect(screen.getByText(/Clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Factures/i)).toBeInTheDocument();
    expect(screen.getByText(/Profil/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
