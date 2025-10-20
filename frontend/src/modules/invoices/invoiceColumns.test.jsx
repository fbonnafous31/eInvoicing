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

// Mock useSellerService pour retourner un plan "premium"
vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    fetchMySeller: vi.fn().mockResolvedValue({ plan: "premium" })
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
});
