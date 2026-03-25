// src/services/invoices.test.js
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { useInvoiceService } from "./invoices";
import * as useAuthModule from "@/hooks/useAuth";

describe("useInvoiceService - tests complets", () => {
  const mockToken = "mock-token";
  let fetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockToken),
    });

    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  // -------------------- Fonctions basiques --------------------
  it("fetchInvoicesBySeller retourne les données", async () => {
    const data = [{ id: 1 }];
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => data });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.fetchInvoicesBySeller();
    expect(res).toEqual(data);
  });

  it("fetchInvoice retourne les données", async () => {
    const invoice = { id: 1 };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => invoice });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.fetchInvoice(1);
    expect(res).toEqual(invoice);
  });

  it("createInvoice envoie POST et retourne les données", async () => {
    const formData = new FormData();
    formData.append("amount", "200");
    const created = { id: 2 };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: async () => created });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.createInvoice(formData);
    expect(res).toEqual(created);
  });

  it("updateInvoice envoie PUT et retourne les données", async () => {
    const formData = new FormData();
    formData.append("amount", "300");
    const updated = { id: 1 };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => updated });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.updateInvoice(1, formData);
    expect(res).toEqual(updated);
  });

  it("deleteInvoice retourne true pour status 204", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.deleteInvoice(1);
    expect(res).toBe(true);
  });

  // -------------------- PDF / téléchargement --------------------
  it("generateInvoicePdf retourne les données", async () => {
    const pdfData = { url: "url" };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => pdfData });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.generateInvoicePdf(1);
    expect(res).toEqual(pdfData);
  });

  it("fetchInvoicePdf retourne blob", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.fetchInvoicePdf({ id: 1 });
    expect(res).toBeInstanceOf(Blob);
  });
  
  // -------------------- Envoi / mail --------------------
  it("sendInvoice envoie POST", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true }) });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.sendInvoice(1);
    expect(res).toEqual({ success: true });
  });

  it("sendInvoiceMail envoie POST avec body", async () => {
    const body = { message: "msg", subject: "sub", to: "test@test.com" };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ sent: true }) });

    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.sendInvoiceMail(1, body);
    expect(res).toEqual({ sent: true });
  });

  // -------------------- Status / lifecycle --------------------
  it("getInvoiceStatus retourne les données", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: "ok" }) });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.getInvoiceStatus(1);
    expect(res).toEqual({ status: "ok" });
  });

  it("pollInvoiceStatusPDP résout si statut final", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ technicalStatus: "validated" }) });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.pollInvoiceStatusPDP("sub-1", 10, 100);
    expect(res).toEqual({ technicalStatus: "validated" });
  });

  it("pollInvoiceStatusPDP timeout rejette", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ technicalStatus: "pending" }) });
    const { result } = renderHook(() => useInvoiceService());
    await expect(result.current.pollInvoiceStatusPDP("sub-1", 10, 50)).rejects.toThrow("Timeout récupération statut PDP");
  });

  it("pollInvoiceLifecycle résout null si lifecycle vide", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ lifecycle: [] }) });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.pollInvoiceLifecycle(1, 10, 100);
    expect(res).toBeNull();
  });

  it("cashInvoice envoie POST", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ paid: true }) });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.cashInvoice(1);
    expect(res).toEqual({ paid: true });
  });

  it("getInvoiceStatusComment retourne data", async () => {
    const comment = { comment: "ok" };
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => comment });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.getInvoiceStatusComment(1, 200);
    expect(res).toEqual(comment);
  });

  it("getInvoicePdfA3Url retourne url", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ url: "a3.pdf" }) });
    const { result } = renderHook(() => useInvoiceService());
    const url = await result.current.getInvoicePdfA3Url(1);
    expect(url).toBe("a3.pdf");
  });

  it("getInvoicePdfA3Proxy retourne blob", async () => {
    const blob = new Blob(["test"], { type: "application/pdf" });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob });
    const { result } = renderHook(() => useInvoiceService());
    const res = await result.current.getInvoicePdfA3Proxy(1);
    expect(res).toBeInstanceOf(Blob);
  });

  // -------------------- Gestion d'erreurs --------------------
  it("request throw si fetch nok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: "Bad Request" }) });
    const { result } = renderHook(() => useInvoiceService());
    await expect(result.current.fetchInvoice(1)).rejects.toThrow("Bad Request");
  });

  it("request throw si fetch nok sans json", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error("fail") } });
    const { result } = renderHook(() => useInvoiceService());
    await expect(result.current.fetchInvoice(1)).rejects.toThrow("Erreur 500");
  });
});