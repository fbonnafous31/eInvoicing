// src/components/auth/LoginButton.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginButton } from "./LoginButton";

// Mock du module Auth0
const loginWithRedirectMock = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    loginWithRedirect: loginWithRedirectMock,
  }),
}));

beforeEach(() => {
  loginWithRedirectMock.mockClear();
});

describe("LoginButton", () => {
  it("rend un bouton avec le texte 'Se connecter'", () => {
    render(<LoginButton />);
    expect(screen.getByRole("button")).toHaveTextContent("Se connecter");
  });

  it("appelle loginWithRedirect au clic", () => {
    render(<LoginButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(loginWithRedirectMock).toHaveBeenCalled();
  });
});
