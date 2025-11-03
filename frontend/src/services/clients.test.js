// src/services/clients.test.js
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { useClientService } from "./clients";
import * as useAuthModule from "../hooks/useAuth"; // 🔹 Import en tant que module pour vi.spyOn

describe("useClientService", () => {
  const mockToken = "mock-token";
  let fetchMock;

  beforeEach(() => {
    // 🔹 Mock useAuth
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockToken),
    });

    // 🔹 Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // 🔹 Mock VITE_API_URL pour éviter "undefined" dans l'URL
    if (!import.meta.env) import.meta.env = {};
    import.meta.env.VITE_API_URL = "http://localhost:3000";
  });

  it("fetchClients appelle fetch et retourne les données", async () => {
    const data = [{ id: 1, name: "Client 1" }];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const { result } = renderHook(() => useClientService());
    const clients = await act(() => result.current.fetchClients());

    expect(clients).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/clients"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it("fetchClient retourne un client spécifique", async () => {
    const client = { id: 1, name: "Client 1" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => client,
    });

    const { result } = renderHook(() => useClientService());
    const fetched = await act(() => result.current.fetchClient(1));

    expect(fetched).toEqual(client);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/clients/1"),
      expect.any(Object)
    );
  });

  it("createClient envoie un POST avec les données", async () => {
    const newClient = { name: "New Client" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, ...newClient }),
    });

    const { result } = renderHook(() => useClientService());
    const created = await act(() => result.current.createClient(newClient));

    expect(created).toEqual({ id: 2, ...newClient });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/clients"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(newClient),
      })
    );
  });

  it("updateClient envoie un PUT avec les données", async () => {
    const updatedClient = { name: "Updated Client" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => updatedClient,
    });

    const { result } = renderHook(() => useClientService());
    const updated = await act(() => result.current.updateClient(1, updatedClient));

    expect(updated).toEqual(updatedClient);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/clients/1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(updatedClient),
      })
    );
  });

  it("deleteClient retourne true pour status 204", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const { result } = renderHook(() => useClientService());
    const response = await act(() => result.current.deleteClient(1));

    expect(response).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/clients/1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("checkSiret construit correctement l'URL et retourne les données", async () => {
    const siretResponse = { exists: false };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => siretResponse,
    });

    const { result } = renderHook(() => useClientService());
    const res = await act(() => result.current.checkSiret("12345678901234", 5));

    expect(res).toEqual(siretResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/clients/check-siret/12345678901234?id=5"),
      expect.any(Object)
    );
  });

  it("throw une erreur si fetch échoue", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    const { result } = renderHook(() => useClientService());
    await expect(act(() => result.current.fetchClients())).rejects.toThrow(
      /Erreur 400: Bad Request/
    );
  });
});
