// src/services/sellers.test.js
import { renderHook } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { useSellerService } from "./sellers";
import * as useAuthModule from "@/hooks/useAuth";

describe("useSellerService", () => {
  const mockToken = "mock-token";
  let fetchMock;

  beforeEach(() => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockToken),
    });

    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  it("fetchMySeller retourne les données du vendeur connecté", async () => {
    const seller = { id: 1, legal_name: "Ma Société" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(seller),
    });

    const { result } = renderHook(() => useSellerService());
    const data = await result.current.fetchMySeller();

    expect(data).toEqual(seller);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sellers/me"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it("createSeller envoie un POST et retourne le seller créé", async () => {
    const newSeller = { legal_name: "Nouveau Vendeur" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 2, ...newSeller }),
    });

    const { result } = renderHook(() => useSellerService());
    const created = await result.current.createSeller(newSeller);

    expect(created).toEqual({ id: 2, ...newSeller });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sellers"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(newSeller),
      })
    );
  });

  it("updateSeller envoie un PUT et retourne le seller mis à jour", async () => {
    const updatedSeller = { legal_name: "Vendeur Mis à Jour" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(updatedSeller),
    });

    const { result } = renderHook(() => useSellerService());
    const updated = await result.current.updateSeller(1, updatedSeller);

    expect(updated).toEqual(updatedSeller);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sellers/1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(updatedSeller),
      })
    );
  });

  it("deleteSeller retourne true pour un DELETE qui ne renvoie rien", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => "",
    });

    const { result } = renderHook(() => useSellerService());
    const response = await result.current.deleteSeller();

    expect(response).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sellers"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("checkIdentifier construit correctement l'URL et retourne les données", async () => {
    const checkResponse = { exists: false };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(checkResponse),
    });

    const { result } = renderHook(() => useSellerService());
    const res = await result.current.checkIdentifier("12345678901234", 5);

    expect(res).toEqual(checkResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/sellers/check-identifier?identifier=12345678901234&id=5"),
      expect.any(Object)
    );
  });

  it("throw une erreur si fetch échoue", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    const { result } = renderHook(() => useSellerService());
    await expect(result.current.fetchMySeller()).rejects.toThrow(
      /Erreur 400: Bad Request/
    );
  });
});
