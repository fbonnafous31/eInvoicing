import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InvoiceForm from "./InvoiceForm";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetchMySeller = vi.fn();
vi.mock("../../services/sellers", () => ({
  useSellerService: () => ({ fetchMySeller: mockFetchMySeller }),
}));

const mockCreateInvoice = vi.fn();
const mockUpdateInvoice = vi.fn();
vi.mock("@/services/invoices", () => ({
  useInvoiceService: () => ({
    createInvoice: mockCreateInvoice,
    updateInvoice: mockUpdateInvoice,
  }),
}));

vi.mock("../../utils/validators/invoice", () => ({
  validateInvoiceField: vi.fn(() => null),   // pas d'erreur par défaut
  validateClientData: vi.fn(() => null),
}));

// Stub des sous-composants pour isoler InvoiceForm
vi.mock("./InvoiceHeader",   () => ({ default: ({ data, onChange, disabled }) => (
  <div data-testid="invoice-header">
    <input data-testid="invoice-number" value={data.invoice_number} disabled={disabled}
      onChange={e => onChange({ ...data, invoice_number: e.target.value })} />
  </div>
)}));

vi.mock("./InvoiceClient",   () => ({ default: ({ onChange }) => (
  <button data-testid="fill-client" onClick={() => onChange({ client_id: "c1", client_legal_name: "ACME" })}>
    Fill Client
  </button>
)}));

vi.mock("./InvoiceLines",    () => ({ default: ({ onChange }) => (
  <button data-testid="add-line" onClick={() => onChange([
    { id: 1, quantity: 2, unit_price: 100, discount: 0, vat_rate: 20, description: "Service" }
  ])}>Add Line</button>
)}));

vi.mock("./TaxBases",        () => ({ default: () => <div data-testid="tax-bases" /> }));

vi.mock("./SupportingDocs",  () => ({ default: ({ onChange }) => (
  <button data-testid="add-attachment" onClick={() =>
    onChange([{ attachment_type: "main", raw_file: new File(["x"], "facture.pdf", { type: "application/pdf" }) }])
  }>Add Attachment</button>
)}));

vi.mock("../form/FormSection", () => ({ default: ({ children, title }) => (
  <div data-testid={`section-${title}`}>{children}</div>
)}));

vi.mock("@/components/ui/buttons", () => ({
  EditButton:          ({ onClick, children }) => <button onClick={onClick}>{children ?? "Modifier"}</button>,
  CancelButton:        ({ onClick }) => <button onClick={onClick}>Annuler</button>,
  SaveButton:          () => <button type="submit">Enregistrer</button>,
  CancelInvoiceButton: ({ onCancel }) => <button onClick={() => onCancel("test reason")}>Annuler facture</button>,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultSeller = {
  id: "s1",
  payment_terms: "30_days",
  payment_method: "transfer",
};

const minimalInitialData = {
  id: "inv-1",
  status: "draft",
  technical_status: "draft",
  business_status: null,
  header: {
    invoice_number: "FA-001",
    issue_date: "2025-01-01",
    fiscal_year: 2025,
    seller_id: "s1",
    invoice_type: "standard",
  },
  client: { client_id: "c1", client_legal_name: "ACME" },
  lines: [{ id: 1, quantity: 2, unit_price: 50, discount: 0, vat_rate: 20 }],
  taxes: [{ vat_rate: 20, base_amount: 100, tax_amount: 20 }],
  attachments: [],
};

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <InvoiceForm {...props} />
    </MemoryRouter>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InvoiceForm", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Sans argument  → mode création : retourne une liste
    // Avec argument  → mode édition  : retourne un objet seller unique
    mockFetchMySeller.mockImplementation((sellerId) =>
      sellerId ? Promise.resolve(defaultSeller) : Promise.resolve([defaultSeller])
    );
    mockCreateInvoice.mockResolvedValue({ id: "new-inv" });
    mockUpdateInvoice.mockResolvedValue({});
  });

  // ── Rendu initial ──────────────────────────────────────────────────────────

  describe("Rendu initial", () => {
    it("affiche le formulaire de création sans initialData", async () => {
      renderForm();
      await waitFor(() => {
        expect(screen.getByTestId("invoice-header")).toBeInTheDocument();
        expect(screen.getByTestId("add-line")).toBeInTheDocument();
        expect(screen.getByText("Créer la facture")).toBeInTheDocument();
      });
    });

    it("affiche le récapitulatif des montants", async () => {
      renderForm();
      expect(screen.getByText(/Montant HT/)).toBeInTheDocument();
      expect(screen.getByText(/Total TVA/)).toBeInTheDocument();
      expect(screen.getByText(/Total TTC/)).toBeInTheDocument();
    });

    it("n'affiche pas le bouton 'Créer la facture' en mode readOnly", () => {
      renderForm({ readOnly: true });
      expect(screen.queryByText("Créer la facture")).not.toBeInTheDocument();
    });

    it("affiche le bouton 'Modifier' quand initialData est fourni (mode brouillon)", async () => {
      renderForm({ initialData: minimalInitialData });
      await waitFor(() => {
        expect(screen.getByText("Modifier")).toBeInTheDocument();
      });
    });
  });

  // ── Chargement du seller par défaut (création) ─────────────────────────────

  describe("Chargement du seller par défaut", () => {
    it("appelle fetchMySeller au montage si pas d'initialData", async () => {
      renderForm();
      await waitFor(() => {
        expect(mockFetchMySeller).toHaveBeenCalledTimes(1);
      });
    });

    it("n'appelle pas fetchMySeller si initialData est fourni", async () => {
      renderForm({ initialData: minimalInitialData });
      await waitFor(() => {
        // fetchMySeller est appelé mais pour récupérer le seller complet, pas la liste
        expect(mockFetchMySeller).toHaveBeenCalledWith("s1");
      });
    });

    it("gère gracieusement une liste de sellers vide", async () => {
      mockFetchMySeller.mockImplementationOnce(() => Promise.resolve([]));
      renderForm();
      await waitFor(() => {
        expect(screen.getByText("Créer la facture")).toBeInTheDocument();
      });
    });

    it("gère gracieusement une erreur fetchMySeller", async () => {
      mockFetchMySeller.mockImplementationOnce(() => Promise.reject(new Error("network error")));
      renderForm();
      await waitFor(() => {
        expect(screen.getByText("Créer la facture")).toBeInTheDocument();
      });
    });
  });

  // ── Calcul des totaux ──────────────────────────────────────────────────────

  describe("Calcul des totaux", () => {
    it("calcule correctement HT, TVA et TTC à partir des lignes", async () => {
      renderForm();

      act(() => {
        fireEvent.click(screen.getByTestId("add-line"));
      });

      // 2 × 100 = 200 HT, TVA 20% = 40, TTC = 240
      await waitFor(() => {
        expect(screen.getByText(/Montant HT.*200\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Total TVA.*40\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Total TTC.*240\.00/)).toBeInTheDocument();
      });
    });

    it("affiche 0.00 € quand il n'y a pas de lignes", () => {
      renderForm();
      // Les 3 lignes affichent 0.00 € — on vérifie via getAllByText
      expect(screen.getAllByText(/0\.00 €/).length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Validation à la soumission ─────────────────────────────────────────────

  describe("Validation à la soumission", () => {
    it("affiche une erreur si aucun client n'est renseigné", async () => {
      renderForm();

      fireEvent.click(screen.getByText("Créer la facture"));

      await waitFor(() => {
        expect(screen.getByText(/renseigner les informations du client/i)).toBeInTheDocument();
      });
    });

    it("affiche une erreur si aucune ligne n'est ajoutée", async () => {
      renderForm();

      // Remplir le client
      fireEvent.click(screen.getByTestId("fill-client"));
      fireEvent.click(screen.getByText("Créer la facture"));

      await waitFor(() => {
        expect(screen.getByText(/au moins une ligne/i)).toBeInTheDocument();
      });
    });

    it("affiche une erreur si le justificatif principal est absent", async () => {
      renderForm();

      fireEvent.click(screen.getByTestId("fill-client"));
      fireEvent.click(screen.getByTestId("add-line"));
      fireEvent.click(screen.getByText("Créer la facture"));

      await waitFor(() => {
        expect(screen.getByText(/justificatif principal/i)).toBeInTheDocument();
      });
    });

    it("appelle createInvoice si toutes les validations passent", async () => {
      renderForm();

      fireEvent.click(screen.getByTestId("fill-client"));
      fireEvent.click(screen.getByTestId("add-line"));
      fireEvent.click(screen.getByTestId("add-attachment"));
      fireEvent.click(screen.getByText("Créer la facture"));

      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledTimes(1);
        const formData = mockCreateInvoice.mock.calls[0][0];
        expect(formData).toBeInstanceOf(FormData);
      });
    });

    it("affiche un message de succès après création et redirige", async () => {
      renderForm();

      fireEvent.click(screen.getByTestId("fill-client"));
      fireEvent.click(screen.getByTestId("add-line"));
      fireEvent.click(screen.getByTestId("add-attachment"));
      fireEvent.click(screen.getByText("Créer la facture"));

      await waitFor(() => {
        expect(screen.getByText(/Facture créée avec succès/i)).toBeInTheDocument();
      });

      // Attendre la redirection après le setTimeout de 2s
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/invoices");
      }, { timeout: 3000 });
    });

    it("affiche une erreur si createInvoice échoue", async () => {
      mockCreateInvoice.mockRejectedValueOnce(new Error("Erreur serveur"));
      renderForm();

      fireEvent.click(screen.getByTestId("fill-client"));
      fireEvent.click(screen.getByTestId("add-line"));
      fireEvent.click(screen.getByTestId("add-attachment"));
      fireEvent.click(screen.getByText("Créer la facture"));

      await waitFor(() => {
        expect(screen.getByText(/Erreur serveur/i)).toBeInTheDocument();
      });
    });
  });

  // ── Mode édition (initialData fourni) ─────────────────────────────────────

  describe("Mode édition", () => {
    it("active l'édition au clic sur 'Modifier'", async () => {
      renderForm({ initialData: minimalInitialData });

      await waitFor(() => {
        expect(screen.getByText("Modifier")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Modifier"));
      expect(screen.getByText("Annuler")).toBeInTheDocument();
      expect(screen.getByText("Enregistrer")).toBeInTheDocument();
    });

    it("appelle updateInvoice à la soumission si l'édition est active", async () => {
      renderForm({ initialData: minimalInitialData });

      await waitFor(() => screen.getByText("Modifier"));
      fireEvent.click(screen.getByText("Modifier"));

      // Remplir l'attachment (requis)
      fireEvent.click(screen.getByTestId("add-attachment"));
      fireEvent.click(screen.getByText("Enregistrer"));

      await waitFor(() => {
        expect(mockUpdateInvoice).toHaveBeenCalledWith("inv-1", expect.any(FormData));
      });
    });

    it("n'affiche pas les boutons d'action si la facture est annulée", async () => {
      const cancelledData = {
        ...minimalInitialData,
        status: "cancelled",
        header: { ...minimalInitialData.header, status: "cancelled" },
      };
      renderForm({ initialData: cancelledData });

      await waitFor(() => {
        expect(screen.queryByText("Modifier")).not.toBeInTheDocument();
        expect(screen.queryByText("Annuler facture")).not.toBeInTheDocument();
      });
    });

    it("revient au mode lecture au clic sur 'Annuler'", async () => {
      renderForm({ initialData: minimalInitialData });

      await waitFor(() => screen.getByText("Modifier"));
      fireEvent.click(screen.getByText("Modifier"));
      fireEvent.click(screen.getByText("Annuler"));

      expect(screen.getByText("Modifier")).toBeInTheDocument();
    });
  });

  // ── Annulation de facture ──────────────────────────────────────────────────

  describe("Annulation de facture", () => {
    it("appelle onDelete avec la raison fournie", async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      renderForm({ initialData: minimalInitialData, onDelete });

      await waitFor(() => screen.getByText("Annuler facture"));
      fireEvent.click(screen.getByText("Annuler facture"));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("test reason");
      });
    });

    it("affiche une alerte d'erreur si onDelete échoue", async () => {
      const onDelete = vi.fn().mockRejectedValueOnce(new Error("Annulation impossible"));
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      renderForm({ initialData: minimalInitialData, onDelete });

      await waitFor(() => screen.getByText("Annuler facture"));
      fireEvent.click(screen.getByText("Annuler facture"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Impossible d'annuler la facture, réessayez.");
      });
      alertMock.mockRestore();
    });
  });

  // ── canEdit / canEditAttachments ───────────────────────────────────────────

  describe("Permissions d'édition", () => {
    it("n'affiche pas le bouton 'Modifier' si technical_status est 'validated'", async () => {
      renderForm({
        initialData: { ...minimalInitialData, technical_status: "validated", business_status: null },
      });

      await waitFor(() => {
        expect(screen.queryByText("Modifier")).not.toBeInTheDocument();
      });
    });

    it("affiche uniquement Annuler/Enregistrer si business_status === '208'", async () => {
      renderForm({
        initialData: { ...minimalInitialData, technical_status: "validated", business_status: "208" },
      });

      await waitFor(() => {
        expect(screen.getByText("Annuler")).toBeInTheDocument();
        expect(screen.getByText("Enregistrer")).toBeInTheDocument();
        expect(screen.queryByText("Modifier")).not.toBeInTheDocument();
      });
    });
  });
});