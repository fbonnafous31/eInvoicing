// src/services/invoices.test.js
import { renderHook } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { useInvoiceService } from "./invoices";
import * as useAuthModule from "@/hooks/useAuth";

// ─── Setup ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return { ok: true, status, json: async () => data };
}

function blobResponse(blob) {
  return { ok: true, status: 200, blob: async () => blob };
}

function errorResponse(status, errorBody = {}) {
  return { ok: false, status, json: async () => errorBody };
}

function getService() {
  const { result } = renderHook(() => useInvoiceService());
  return result.current;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useInvoiceService", () => {

  // ── Authorization header ──────────────────────────────────────────────────

  describe("Authorization header", () => {
    it("envoie le token Bearer sur chaque requête", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 1 }]));
      await getService().fetchInvoicesBySeller();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it("fusionne les headers custom avec Authorization", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
      await getService().sendInvoice(1);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers).toMatchObject({
        Authorization: `Bearer ${mockToken}`,
        "Content-Type": "application/json",
      });
    });
  });

  // ── fetchInvoicesBySeller ─────────────────────────────────────────────────

  describe("fetchInvoicesBySeller", () => {
    it("retourne les données", async () => {
      const data = [{ id: 1 }];
      fetchMock.mockResolvedValueOnce(jsonResponse(data));
      expect(await getService().fetchInvoicesBySeller()).toEqual(data);
    });
  });

  // ── fetchInvoice ──────────────────────────────────────────────────────────

  describe("fetchInvoice", () => {
    it("retourne les données", async () => {
      const invoice = { id: 1 };
      fetchMock.mockResolvedValueOnce(jsonResponse(invoice));
      expect(await getService().fetchInvoice(1)).toEqual(invoice);
    });
  });

  // ── fetchDepositInvoices ──────────────────────────────────────────────────

  describe("fetchDepositInvoices", () => {
    it("appelle /deposits sans clientId", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([]));
      await getService().fetchDepositInvoices();

      const [url] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/deposits$/);
      expect(url).not.toContain("client_id");
    });

    it("appelle /deposits?client_id=X avec clientId", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse([]));
      await getService().fetchDepositInvoices("client-42");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("client_id=client-42");
    });
  });

  // ── createInvoice ─────────────────────────────────────────────────────────

  describe("createInvoice", () => {
    it("envoie POST et retourne les données", async () => {
      const created = { id: 2 };
      fetchMock.mockResolvedValueOnce(jsonResponse(created, 201));
      const res = await getService().createInvoice(new FormData());
      expect(fetchMock.mock.calls[0][1].method).toBe("POST");
      expect(res).toEqual(created);
    });
  });

  // ── updateInvoice ─────────────────────────────────────────────────────────

  describe("updateInvoice", () => {
    it("envoie PUT et retourne les données", async () => {
      const updated = { id: 1 };
      fetchMock.mockResolvedValueOnce(jsonResponse(updated));
      const res = await getService().updateInvoice(1, new FormData());
      expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
      expect(res).toEqual(updated);
    });
  });

  // ── deleteInvoice ─────────────────────────────────────────────────────────

  describe("deleteInvoice", () => {
    it("retourne true pour status 204", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
      expect(await getService().deleteInvoice(1)).toBe(true);
    });

    it("envoie DELETE avec cancelReason null par défaut", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
      await getService().deleteInvoice(1);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.method).toBe("DELETE");
      expect(JSON.parse(options.body)).toEqual({ cancelReason: null });
    });

    it("envoie DELETE avec une cancelReason explicite", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
      await getService().deleteInvoice(1, "Annulation client");

      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ cancelReason: "Annulation client" });
    });
  });

  // ── sendInvoice / sendInvoiceMail ─────────────────────────────────────────

  describe("sendInvoice", () => {
    it("envoie POST et retourne les données", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
      expect(await getService().sendInvoice(1)).toEqual({ success: true });
    });
  });

  describe("sendInvoiceMail", () => {
    it("envoie POST avec le bon body JSON", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ sent: true }));
      const payload = { message: "msg", subject: "sub", to: "a@b.com" };
      await getService().sendInvoiceMail(1, payload);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual(payload);
    });
  });

  // ── generateInvoicePdf ────────────────────────────────────────────────────

  describe("generateInvoicePdf", () => {
    it("retourne les données", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ url: "url" }));
      expect(await getService().generateInvoicePdf(1)).toEqual({ url: "url" });
    });
  });

  // ── fetchInvoicePdf ───────────────────────────────────────────────────────

  describe("fetchInvoicePdf", () => {
    it("retourne un Blob en cas de succès", async () => {
      const blob = new Blob(["pdf"], { type: "application/pdf" });
      fetchMock.mockResolvedValueOnce(blobResponse(blob));
      expect(await getService().fetchInvoicePdf({ id: 1 })).toBeInstanceOf(Blob);
    });

    it("throw si la réponse n'est pas ok", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => "Validation error",
      });
      await expect(getService().fetchInvoicePdf({ id: 1 })).rejects.toThrow(
        "Erreur génération PDF: 422 - Validation error"
      );
    });
  });

  // ── downloadInvoicePdf ────────────────────────────────────────────────────

  describe("downloadInvoicePdf", () => {
    beforeEach(() => {
      // Simule l'API DOM pour le téléchargement
      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:fake-url");
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
        remove: vi.fn(),
      };
      // vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      // vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as any);
    });

    it("throw si l'invoice n'a pas d'id", async () => {
      await expect(getService().downloadInvoicePdf({})).rejects.toThrow(
        "Invoice missing ID"
      );
      await expect(getService().downloadInvoicePdf(null)).rejects.toThrow(
        "Invoice missing ID"
      );
    });

    it("throw si le fetch échoue", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal error",
      });
      await expect(
        getService().downloadInvoicePdf({ id: 1, invoice_number: "F001" })
      ).rejects.toThrow("Erreur génération PDF : 500 - Internal error");
    });
  });

  // ── getInvoiceStatus ──────────────────────────────────────────────────────

  describe("getInvoiceStatus", () => {
    it("retourne les données", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ status: "ok" }));
      expect(await getService().getInvoiceStatus(1)).toEqual({ status: "ok" });
    });
  });

  // ── pollInvoiceStatusPDP ──────────────────────────────────────────────────

  describe("pollInvoiceStatusPDP", () => {
    it("résout immédiatement si statut est 'validated'", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ technicalStatus: "validated" }));
      const res = await getService().pollInvoiceStatusPDP("sub-1", 10, 1000);
      expect(res).toEqual({ technicalStatus: "validated" });
    });

    it("résout immédiatement si statut est 'rejected'", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ technicalStatus: "rejected" }));
      const res = await getService().pollInvoiceStatusPDP("sub-1", 10, 1000);
      expect(res).toEqual({ technicalStatus: "rejected" });
    });

    it("résout après polling si statut intermédiaire puis final", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ technicalStatus: "pending" }))
        .mockResolvedValueOnce(jsonResponse({ technicalStatus: "pending" }))
        .mockResolvedValueOnce(jsonResponse({ technicalStatus: "validated" }));

      const res = await getService().pollInvoiceStatusPDP("sub-1", 10, 5000);
      expect(res.technicalStatus).toBe("validated");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("rejette après timeout si statut reste intermédiaire", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ technicalStatus: "pending" }));
      await expect(
        getService().pollInvoiceStatusPDP("sub-1", 10, 50)
      ).rejects.toThrow("Timeout récupération statut PDP");
    });

    it("rejette si le fetch échoue", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));
      await expect(
        getService().pollInvoiceStatusPDP("sub-1", 10, 1000)
      ).rejects.toThrow("Network error");
    });

    it("est insensible à la casse du statut (VALIDATED)", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ technicalStatus: "VALIDATED" }));
      const res = await getService().pollInvoiceStatusPDP("sub-1", 10, 1000);
      expect(res.technicalStatus).toBe("VALIDATED");
    });
  });

  // ── pollInvoiceLifecycle ──────────────────────────────────────────────────

  describe("pollInvoiceLifecycle", () => {
    it("résout null si lifecycle est vide (facture rejetée)", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ lifecycle: [] }));
      expect(await getService().pollInvoiceLifecycle(1, 10, 1000)).toBeNull();
    });

    it("résout avec lastStatus si code est 201", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ lifecycle: [{ code: 201, label: "Acceptée" }] })
      );
      const res = await getService().pollInvoiceLifecycle(1, 10, 1000);
      expect(res).toEqual({ status_code: 201, status_label: "Acceptée" });
    });

    it("résout avec lastStatus si code est 299", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ lifecycle: [{ code: 299, label: "Terminal" }] })
      );
      const res = await getService().pollInvoiceLifecycle(1, 10, 1000);
      expect(res).toEqual({ status_code: 299, status_label: "Terminal" });
    });

    it("utilise le dernier élément du tableau lifecycle", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          lifecycle: [
            { code: 100, label: "Initial" },
            { code: 201, label: "Final" },
          ],
        })
      );
      const res = await getService().pollInvoiceLifecycle(1, 10, 1000);
      expect(res?.status_code).toBe(201);
    });

    it("continue de poller si le code n'est pas final", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ lifecycle: [{ code: 100, label: "En cours" }] }))
        .mockResolvedValueOnce(jsonResponse({ lifecycle: [{ code: 201, label: "Acceptée" }] }));

      const res = await getService().pollInvoiceLifecycle(1, 10, 5000);
      expect(res?.status_code).toBe(201);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("rejette après timeout si statut non final", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ lifecycle: [{ code: 100, label: "En cours" }] })
      );
      await expect(
        getService().pollInvoiceLifecycle(1, 10, 50)
      ).rejects.toThrow("Timeout récupération statut métier");
    });

    it("rejette si le fetch échoue", async () => {
      fetchMock.mockRejectedValue(new Error("Unreachable"));
      await expect(
        getService().pollInvoiceLifecycle(1, 10, 1000)
      ).rejects.toThrow("Unreachable");
    });

    it("traite lifecycle non-tableau comme tableau vide", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ lifecycle: null }));
      expect(await getService().pollInvoiceLifecycle(1, 10, 1000)).toBeNull();
    });
  });

  // ── getInvoicePdfA3Url ────────────────────────────────────────────────────

  describe("getInvoicePdfA3Url", () => {
    it("retourne l'url", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ url: "a3.pdf" }));
      expect(await getService().getInvoicePdfA3Url(1)).toBe("a3.pdf");
    });

    it("throw si res.ok=false", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });
      await expect(getService().getInvoicePdfA3Url(1)).rejects.toThrow("Not found");
    });

    it("fallback 'Erreur 404' si json ne parse pas", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => { throw new Error("parse fail"); },
      });
      await expect(getService().getInvoicePdfA3Url(1)).rejects.toThrow("Erreur 404");
    });
  });

  // ── getInvoicePdfA3Proxy ──────────────────────────────────────────────────

  describe("getInvoicePdfA3Proxy", () => {
    it("retourne un Blob", async () => {
      const blob = new Blob(["test"], { type: "application/pdf" });
      fetchMock.mockResolvedValueOnce(blobResponse(blob));
      expect(await getService().getInvoicePdfA3Proxy(1)).toBeInstanceOf(Blob);
    });

    it("throw si res.ok=false", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
      await expect(getService().getInvoicePdfA3Proxy(1)).rejects.toThrow("Erreur serveur (503)");
    });
  });

  // ── cashInvoice ───────────────────────────────────────────────────────────

  describe("cashInvoice", () => {
    it("envoie POST et retourne les données", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ paid: true }));
      expect(await getService().cashInvoice(1)).toEqual({ paid: true });
    });
  });

  // ── getInvoiceStatusComment ───────────────────────────────────────────────

  describe("getInvoiceStatusComment", () => {
    it("retourne le commentaire", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ comment: "ok" }));
      expect(await getService().getInvoiceStatusComment(1, 200)).toEqual({ comment: "ok" });
    });
  });

  // ── refreshInvoiceLifecycle ───────────────────────────────────────────────

  describe("refreshInvoiceLifecycle", () => {
    it("envoie POST vers /refresh-status", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ refreshed: true }));
      await getService().refreshInvoiceLifecycle(1);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/refresh-status");
      expect(options.method).toBe("POST");
    });
  });

  // ── Gestion d'erreurs (request helper) ────────────────────────────────────

  describe("gestion d'erreurs HTTP", () => {
    it("throw avec data.error si présent", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(400, { error: "Bad Request" }));
      await expect(getService().fetchInvoice(1)).rejects.toThrow("Bad Request");
    });

    it("throw avec data.message si error absent", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(422, { message: "Unprocessable" }));
      await expect(getService().fetchInvoice(1)).rejects.toThrow("Unprocessable");
    });

    it("throw 'Erreur N' si le body JSON ne parse pas", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error("parse fail"); },
      });
      await expect(getService().fetchInvoice(1)).rejects.toThrow("Erreur 500");
    });
  });
});