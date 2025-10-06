// src/services/invoices.test.js
import { renderHook } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { useInvoiceService } from "./invoices";
import * as useAuthModule from "@/hooks/useAuth";

describe("useInvoiceService", () => {
  const mockToken = "mock-token";
  let fetchMock;

  beforeEach(() => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockToken),
    });

    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  it("fetchInvoice retourne les données d'une facture", async () => {
    const invoice = { id: 1, amount: 100 };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => invoice,
    });

    const { result } = renderHook(() => useInvoiceService());
    const data = await result.current.fetchInvoice(1);

    expect(data).toEqual(invoice);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/invoices/1"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${mockToken}` }),
      })
    );
  });

  it("createInvoice envoie un POST et retourne les données", async () => {
    const formData = new FormData();
    formData.append("amount", "200");

    const created = { id: 2, amount: 200 };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => created,
    });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.createInvoice(formData);

    expect(res).toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/invoices"),
      expect.objectContaining({ method: "POST", body: formData })
    );
  });

  it("deleteInvoice retourne true pour status 204", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.deleteInvoice(1);

    expect(res).toBe(true);
  });

  it("throw une erreur si fetch échoue", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Bad Request" }),
    });

    const { result } = renderHook(() => useInvoiceService());
    await expect(result.current.fetchInvoice(1)).rejects.toThrow("Bad Request");
  });

  // Exemple simple de test pour pollInvoiceStatusPDP
  it("pollInvoiceStatusPDP résout rapidement si statut final", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ technicalStatus: "validated" }),
    });

    const { result } = renderHook(() => useInvoiceService());
    const data = await result.current.pollInvoiceStatusPDP("sub-1", 10, 100);
    expect(data).toEqual({ technicalStatus: "validated" });
  });

  // Exemple simple de test pour pollInvoiceLifecycle
  it("pollInvoiceLifecycle résout avec null si lifecycle vide", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ lifecycle: [] }),
    });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.pollInvoiceLifecycle(1, 10, 100);
    expect(res).toBeNull();
  });
});
