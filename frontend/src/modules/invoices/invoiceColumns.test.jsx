import { renderHook, act } from "@testing-library/react";
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

  it("retourne un tableau de colonnes", () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it("contient la colonne 'Voir / Modifier / PDF ' avec boutons", () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });
    const viewColumn = result.current.find(c => c.name.includes("Voir / Modifier / PDF"));
    expect(viewColumn).toBeDefined();

    // Test cellule
    const row = { id: 1, invoice_number: "INV-001" };
    const cell = viewColumn.cell(row);
    const buttons = cell.props.children.filter(c => c.type === "button");
    expect(buttons.length).toBeGreaterThanOrEqual(4); // 👁️ ✏️ 📄 PDF 📄 PDF/A
  });

  it("contient la colonne 'Envoyer / Statut' avec boutons", () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });
    const sendColumn = result.current.find(c => c.name.includes("Envoyer / Statut"));
    expect(sendColumn).toBeDefined();

    const row = { id: 1, business_status: "208", technical_status: "validated" };
    const cell = sendColumn.cell(row);
    const buttons = cell.props.children.filter(c => c.type === "button");
    expect(buttons.length).toBeGreaterThanOrEqual(3); // Envoyer, Rafraîchir, Encaissement
  });

  it("contient la colonne 'Client' qui rend un EllipsisCell", () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });
    const clientColumn = result.current.find(c => c.name === "Client");
    expect(clientColumn).toBeDefined();

    const row = { client: { legal_name: "ACME" } };
    const cell = clientColumn.cell(row);
    expect(cell.props.value).toBe("ACME");
  });

  it("contient la colonne 'Statut facture' qui rend un BusinessStatusCell", () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });
    const statusColumn = result.current.find(c => c.name === "Statut facture");
    expect(statusColumn).toBeDefined();

    const row = { id: 1, business_status: "208", technical_status: "validated" };
    const cell = statusColumn.cell(row);
    expect(cell.type.name).toBe("BusinessStatusCell");
  });

  it("contient la colonne 'Statut PDP' qui rend un TechnicalStatusCell", () => {
    const { result } = renderHook(() => useInvoiceColumns(fakeService), { wrapper });
    const pdpColumn = result.current.find(c => c.name === "Statut PDP");
    expect(pdpColumn).toBeDefined();

    const row = { id: 1, technical_status: "validated" };
    const cell = pdpColumn.cell(row);
    expect(cell.type.name).toBe("TechnicalStatusCell");
  });
});
