// src/hooks/useAuth.test.jsx
import { renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { vi } from "vitest";

// ----------------------
// Mock de useAuth0
// ----------------------
const mockGetAccessTokenSilently = vi.fn();
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    getAccessTokenSilently: mockGetAccessTokenSilently,
  }),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("récupère le token via getAccessTokenSilently", async () => {
    const fakeToken = "aaa.bbb.ccc";
    mockGetAccessTokenSilently.mockResolvedValue(fakeToken);

    // Mock de l'env pour le test
    const OLD_ENV = process.env;
    process.env = { ...OLD_ENV, VITE_AUTH0_AUDIENCE: "https://api.einvoicing.local" };

    const { result } = renderHook(() => useAuth());
    const token = await result.current.getToken();

    expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({
      authorizationParams: { audience: "https://api.einvoicing.local" },
    });
    expect(token).toBe(fakeToken);

    process.env = OLD_ENV; // restore
  });

  it("log un warning si le token est chiffré (JWE)", async () => {
    const jweToken = "a.b.c.d.e"; // 5 parties
    mockGetAccessTokenSilently.mockResolvedValue(jweToken);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useAuth());
    await result.current.getToken();

    expect(warnSpy).toHaveBeenCalledWith("[Auth] Format JWE (token chiffré) ⚠️");
    warnSpy.mockRestore();
  });

  it("log un warning si format token inattendu", async () => {
    const badToken = "a.b"; // 2 parties
    mockGetAccessTokenSilently.mockResolvedValue(badToken);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useAuth());
    await result.current.getToken();

    expect(warnSpy).toHaveBeenCalledWith("[Auth] Format token inattendu ⚠️");
    warnSpy.mockRestore();
  });

  it("propage l'erreur si getAccessTokenSilently échoue", async () => {
    const err = new Error("fail");
    mockGetAccessTokenSilently.mockRejectedValue(err);

    const { result } = renderHook(() => useAuth());
    await expect(result.current.getToken()).rejects.toThrow("fail");
  });
});
