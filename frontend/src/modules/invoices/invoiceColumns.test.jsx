import { renderHook, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import useInvoiceColumns from '../../modules/invoices/invoiceColumns';
import { vi } from "vitest";

// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock useSellerService globalement pour les tests
vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    fetchMySeller: vi.fn().mockResolvedValue({ plan: "premium" }),
  }),
}));

describe("useInvoiceColumns", () => {
  let fakeService;

  beforeEach(() => {
    fakeService = {
      getInvoiceStatus: vi.fn().mockResolvedValue({ technicalStatus: "validated" }),
      generateInvoicePdf: vi.fn().mockResolvedValue({ path: "/fake.pdf" }),
      sendInvoice: vi.fn().mockResolvedValue({ submissionId: "123" }),
      fetchInvoice: vi.fn().mockResolvedValue({ business_status: "208", lifecycle: [] }),
      refreshInvoiceLifecycle: vi.fn().mockResolvedValue({ lastStatus: [] }),
      cashInvoice: vi.fn().mockResolvedValue({ newStatus: { code: "212", label: "Payé" } }),
      getInvoiceStatusComment: vi.fn().mockResolvedValue({ comment: "Test comment" }),
    };
  });

  const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

  it("contient la colonne 'Envoyer / Statut' avec boutons", async () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    await waitFor(() => {
      const sendColumn = result.current.find(c => c.name.includes("Envoyer / Statut"));
      expect(sendColumn).toBeDefined();

      const row = { id: 1, business_status: "208", technical_status: "validated" };
      const cell = sendColumn.cell(row);
      const buttons = cell.props.children.filter(c => c.type === "button");
      expect(buttons.length).toBeGreaterThanOrEqual(3); // Envoyer, Rafraîchir, Encaissement
    });
  });

  it("contient la colonne 'Statut facture' qui rend un BusinessStatusCell", async () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    await waitFor(() => {
      const statusColumn = result.current.find(c => c.name === "Statut facture");
      expect(statusColumn).toBeDefined();

      const row = { id: 1, business_status: "208", technical_status: "validated" };
      const cell = statusColumn.cell(row);
      expect(cell.type.name).toBe("BusinessStatusCell");
    });
  });

  it("contient la colonne 'Statut PDP' qui rend un TechnicalStatusCell", async () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    await waitFor(() => {
      const pdpColumn = result.current.find(c => c.name === "Statut PDP");
      expect(pdpColumn).toBeDefined();

      const row = { id: 1, technical_status: "validated" };
      const cell = pdpColumn.cell(row);
      expect(cell.type.name).toBe("TechnicalStatusCell");
    });
  });

  it("contient la colonne 'Actions' avec tous les boutons", async () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    await waitFor(() => {
      const actionsColumn = result.current.find(c => c.name === "Actions");
      expect(actionsColumn).toBeDefined();

      const row = { id: 1, invoice_number: "INV-001", smtp: { active: true } };
      const cell = actionsColumn.cell(row);

      const buttons = cell.props.children.filter(c => c.type === "button");
      expect(buttons.length).toBeGreaterThanOrEqual(4);

      const titles = buttons.map(b => b.props.title);
      expect(titles).toEqual(
        expect.arrayContaining([
          "Consulter la facture",
          "Modifier la facture",
          "Télécharger le devis",
          "Télécharger la facture au format PDF/A-3"
        ])
      );
    });
  });

  it("filtre les colonnes pour le plan 'essentiel'", async () => {
    // 🔹 Remocker avant le renderHook
    const sellersModule = await vi.importActual('@/services/sellers');
    vi.spyOn(sellersModule, 'useSellerService').mockImplementation(() => ({
      fetchMySeller: vi.fn().mockResolvedValue({ plan: "essentiel" })
    }));

    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    await waitFor(() => {
      const colNames = result.current.map(c => c.name);
      expect(colNames).not.toContain("Envoyer / Statut");
      expect(colNames).not.toContain("Statut facture");
      expect(colNames).not.toContain("Statut PDP");
    });
  });

  it("rend les colonnes simples correctement", async () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    await waitFor(() => {
      const row = {
        invoice_number: "INV-001",
        issue_date: "2025-10-29",
        contract_number: "C-001",
        purchase_order_number: "PO-001",
        client: { legal_name: "Client A" },
        subtotal: 100,
        total_taxes: 20,
        total: 120,
        business_status: "208",
        technical_status: "validated",
        created_at: "2025-10-28",
        updated_at: "2025-10-29",
      };

      const colNames = [
        "Référence",
        "Emise le",
        "Contrat",
        "Commande",
        "Client",
        "HT",
        "TVA",
        "TTC",
        "Créé le",
        "Modifié le"
      ];

      colNames.forEach(name => {
        const col = result.current.find(c => c.name === name);
        expect(col).toBeDefined();

        // Si la colonne a une fonction cell, on l’utilise, sinon on prend selector
        const content = col.cell ? col.cell(row) : col.selector(row);
        expect(content).toBeDefined();
      });
    });
  });
});
