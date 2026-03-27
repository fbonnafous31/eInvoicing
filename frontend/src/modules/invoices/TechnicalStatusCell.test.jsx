// src/components/invoices/TechnicalStatusCell.test.jsx
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TechnicalStatusCell from "./TechnicalStatusCell";

// ─── Mock des traductions ─────────────────────────────────────────────────────

vi.mock("../../constants/translations", () => ({
  FR: {
    technicalStatus: {
      pending:   "En attente",
      received:  "Reçu",
      validated: "Validé",
      rejected:  "Rejeté",
      error:     "Erreur",
    },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRow = (overrides = {}) => ({
  id: "inv1",
  technical_status: "pending",
  submissionId: null,
  ...overrides,
});

const makeService = (resolvedStatus = null) => ({
  pollInvoiceStatusPDP: vi.fn().mockResolvedValue(
    resolvedStatus ? { technicalStatus: resolvedStatus } : {}
  ),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TechnicalStatusCell", () => {

  // ── Rendu ──────────────────────────────────────────────────────────────────

  describe("rendu du badge", () => {
    it("affiche PENDING par défaut si technical_status est absent", () => {
      render(
        <TechnicalStatusCell
          row={{ id: "1" }}           // pas de technical_status
          invoiceService={makeService()}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      expect(screen.getByText("En attente")).toBeInTheDocument();
    });

    it.each([
      ["pending",   "En attente", "gray"],
      ["received",  "Reçu",       "green"],
      ["validated", "Validé",     "blue"],
      ["rejected",  "Rejeté",     "red"],
      ["error",     "Erreur",     "darkred"],
    ])("statut %s → label %s et couleur %s", (status, label, color) => {
      render(
        <TechnicalStatusCell
          row={makeRow({ technical_status: status })}
          invoiceService={makeService()}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge.style.backgroundColor).toBe(color);
    });

    it("est insensible à la casse du statut (VALIDATED → Validé)", () => {
      render(
        <TechnicalStatusCell
          row={makeRow({ technical_status: "VALIDATED" })}
          invoiceService={makeService()}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      expect(screen.getByText("Validé")).toBeInTheDocument();
    });

    it("affiche la clé brute si la traduction est inconnue", () => {
      render(
        <TechnicalStatusCell
          row={makeRow({ technical_status: "UNKNOWN_STATUS" })}
          invoiceService={makeService()}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      expect(screen.getByText("unknown_status")).toBeInTheDocument();
    });

    it("applique les styles de mise en forme du badge", () => {
      render(
        <TechnicalStatusCell
          row={makeRow({ technical_status: "validated" })}
          invoiceService={makeService()}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      const badge = screen.getByText("Validé");
      expect(badge.style.borderRadius).toBe("4px");
      expect(badge.style.color).toBe("white");
      expect(badge.style.fontWeight).toBe("500");
    });
  });

  // ── Polling ────────────────────────────────────────────────────────────────

  describe("polling PDP", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("ne lance pas le polling si submissionId est absent", async () => {
      const service = makeService();
      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: null })}
          invoiceService={service}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      // Avancer le temps — aucun appel ne doit avoir lieu
      await act(async () => { vi.advanceTimersByTime(10000); });
      expect(service.pollInvoiceStatusPDP).not.toHaveBeenCalled();
    });

    it("ne lance pas le polling si le statut est déjà 'validated'", async () => {
      const service = makeService();
      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "validated" })}
          invoiceService={service}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      await act(async () => { vi.advanceTimersByTime(6000); });
      expect(service.pollInvoiceStatusPDP).not.toHaveBeenCalled();
    });

    it("ne lance pas le polling si le statut est déjà 'rejected'", async () => {
      const service = makeService();
      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "rejected" })}
          invoiceService={service}
          onTechnicalStatusChange={vi.fn()}
        />
      );
      await act(async () => { vi.advanceTimersByTime(6000); });
      expect(service.pollInvoiceStatusPDP).not.toHaveBeenCalled();
    });

    it("effectue un appel immédiat dès le montage (sans attendre l'intervalle)", async () => {
      const service = makeService("received");
      const onStatusChange = vi.fn();

      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
          invoiceService={service}
          onTechnicalStatusChange={onStatusChange}
        />
      );

      // Flush seulement les microtâches (promesses), pas le timer
      await act(async () => {});

      expect(service.pollInvoiceStatusPDP).toHaveBeenCalledTimes(1);
      expect(service.pollInvoiceStatusPDP).toHaveBeenCalledWith("sub1", 2000, 20000);
      expect(onStatusChange).toHaveBeenCalledWith("inv1", "received");
    });

    it("appelle onTechnicalStatusChange à chaque tick d'intervalle", async () => {
      const service = makeService("received");
      const onStatusChange = vi.fn();

      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
          invoiceService={service}
          onTechnicalStatusChange={onStatusChange}
        />
      );

      // Appel immédiat
      await act(async () => {});
      // +1 tick intervalle (2s)
      await act(async () => { vi.advanceTimersByTime(2000); });
      // +1 tick intervalle (2s)
      await act(async () => { vi.advanceTimersByTime(2000); });

      // 1 immédiat + 2 intervalles = 3 appels
      expect(service.pollInvoiceStatusPDP).toHaveBeenCalledTimes(3);
      expect(onStatusChange).toHaveBeenCalledTimes(3);
    });

    it("arrête le polling quand le statut retourné est 'validated'", async () => {
      const service = makeService("validated");
      const onStatusChange = vi.fn();

      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
          invoiceService={service}
          onTechnicalStatusChange={onStatusChange}
        />
      );

      // Appel immédiat
      await act(async () => {});
      // Premier tick — clearInterval doit être appelé
      await act(async () => { vi.advanceTimersByTime(2000); });
      // Deuxième tick — plus d'appel
      await act(async () => { vi.advanceTimersByTime(2000); });

      // 1 immédiat + 1 intervalle avant stop = 2 appels max
      expect(service.pollInvoiceStatusPDP).toHaveBeenCalledTimes(2);
    });

    it("n'appelle pas onTechnicalStatusChange si la réponse n'a pas technicalStatus", async () => {
      const service = {
        pollInvoiceStatusPDP: vi.fn().mockResolvedValue({}), // pas de technicalStatus
      };
      const onStatusChange = vi.fn();

      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
          invoiceService={service}
          onTechnicalStatusChange={onStatusChange}
        />
      );

      await act(async () => {});
      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it("fonctionne si onTechnicalStatusChange est undefined", async () => {
      const service = makeService("received");

      expect(() => {
        render(
          <TechnicalStatusCell
            row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
            invoiceService={service}
            // pas de onTechnicalStatusChange
          />
        );
      }).not.toThrow();

      await act(async () => {});
      // Pas de crash malgré l'appel optionnel onTechnicalStatusChange?.()
    });

    it("arrête le polling et nettoie l'intervalle au unmount", async () => {
      const service = makeService("received");
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

      const { unmount } = render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
          invoiceService={service}
          onTechnicalStatusChange={vi.fn()}
        />
      );

      await act(async () => {});
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  // ── Erreurs ────────────────────────────────────────────────────────────────

  describe("gestion des erreurs", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.mocked(console.error).mockRestore();
    });

    it("log l'erreur et ne crash pas si le poll initial rejette", async () => {
      const service = {
        pollInvoiceStatusPDP: vi.fn().mockRejectedValue(new Error("timeout")),
      };

      expect(() => {
        render(
          <TechnicalStatusCell
            row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
            invoiceService={service}
            onTechnicalStatusChange={vi.fn()}
          />
        );
      }).not.toThrow();

      await act(async () => {});

      expect(console.error).toHaveBeenCalledWith(
        "Erreur polling PDP initial :",
        expect.any(Error)
      );
      expect(screen.getByText("En attente")).toBeInTheDocument();
    });

    it("arrête l'intervalle et log si le poll de l'intervalle rejette", async () => {
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
      const service = {
        pollInvoiceStatusPDP: vi.fn()
          .mockResolvedValueOnce({})          // poll immédiat OK
          .mockRejectedValue(new Error("network")), // intervalle KO
      };

      render(
        <TechnicalStatusCell
          row={makeRow({ submissionId: "sub1", technical_status: "pending" })}
          invoiceService={service}
          onTechnicalStatusChange={vi.fn()}
        />
      );

      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(2000); });

      expect(console.error).toHaveBeenCalledWith(
        "Erreur polling PDP:",
        expect.any(Error)
      );
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});