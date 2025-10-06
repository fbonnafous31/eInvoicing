// src/components/auth/LogoutButton.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutButton } from "./LogoutButton";

// Mock du module Auth0
const logoutMock = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    logout: logoutMock,
  }),
}));

beforeEach(() => {
  logoutMock.mockClear();
});

describe("LogoutButton", () => {
  it("rend un bouton avec le texte 'Se déconnecter'", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button")).toHaveTextContent("Se déconnecter");
  });

  it("appelle logout au clic avec les bons paramètres", () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(logoutMock).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
  });
});
