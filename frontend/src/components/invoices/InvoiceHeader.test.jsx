// frontend/src/components/invoices/InvoiceHeader.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import InvoiceHeader from "./InvoiceHeader";

// ─── Mocks services et validators ──────────────────────────────────────────────
const mockOnChange = vi.fn();
const mockFetchMySeller = vi.fn();
const mockFetchInvoicesBySeller = vi.fn();
const mockFetchDepositInvoices = vi.fn();

vi.mock("../../services/sellers", () => ({
  useSellerService: () => ({ fetchMySeller: mockFetchMySeller }),
}));

vi.mock("../../services/invoices", () => ({
  useInvoiceService: () => ({
    fetchInvoicesBySeller: mockFetchInvoicesBySeller,
    fetchDepositInvoices: mockFetchDepositInvoices,
  }),
}));

vi.mock("../../utils/validators/invoice", () => ({
  validateInvoiceField: vi.fn(() => null),
}));

vi.mock("../../utils/validators/issueDate", () => ({
  validateIssueDate: vi.fn(() => null),
}));

// ─── Mocks composants UI ──────────────────────────────────────────────────────
vi.mock('@/components/form', () => ({
  FormSection: ({ children }) => <div>{children}</div>,
  InputField: ({ id, value, onChange, ...rest }) => (
    <input aria-label={id} value={value || ""} onChange={e => onChange(e.target.value)} {...rest} />
  ),
  SelectField: ({ label, value, onChange }) => (
    <select aria-label={label} value={value || ""} onChange={e => onChange(e.target.value)}>
      <option value="">--</option>
    </select>
  ),
  DatePickerField: ({ label, value, onChange }) => (
    <input type="date" aria-label="Date émission" value={value || ""} onChange={e => onChange(e.target.value)} />
  ),
  CreatableSelect: ({ label, value, onChange }) => (
    <input aria-label={label} value={value?.value || value || ""} onChange={e => onChange({ value: e.target.value })} />
  ),
}));

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InvoiceHeader", () => {

  it("auto-fill seller_id si vide", async () => {
    mockFetchMySeller.mockResolvedValue({ id: 42 });
    render(<InvoiceHeader data={{}} onChange={mockOnChange} />);
    await waitFor(() => expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ seller_id: 42 })));
  });

  it("fetchInvoicesBySeller met à jour allInvoices", async () => {
    const invoices = [{ id: "inv1", invoice_number: "FA-001", total: 100 }];
    mockFetchInvoicesBySeller.mockResolvedValue(invoices);
    render(<InvoiceHeader data={{}} onChange={mockOnChange} />);
    await waitFor(() => expect(mockFetchInvoicesBySeller).toHaveBeenCalled());
  });

  it("fetchDepositInvoices met à jour depositInvoices", async () => {
    const deposits = [{ id: "dep1", invoice_number: "AC-001", total: 50 }];
    mockFetchDepositInvoices.mockResolvedValue(deposits);
    render(<InvoiceHeader data={{ client_id: "c1", invoice_type: "final" }} onChange={mockOnChange} />);
    await waitFor(() => expect(mockFetchDepositInvoices).toHaveBeenCalledWith("c1"));
  });

  it("raccorde automatiquement l'ID de la facture d’origine si trouvée", async () => {
    const deposits = [{ id: "dep1", invoice_number: "AC-001", total: 50 }];
    mockFetchDepositInvoices.mockResolvedValue(deposits);
    render(<InvoiceHeader data={{ original_invoice_number: "AC-001", invoice_type: "final", client_id: "c1" }} onChange={mockOnChange} />);
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ original_invoice_id: "dep1", deposit_amount: 50 }));
    });
  });

  it("marque referenceStatus='not_found' si facture non trouvée", async () => {
    mockFetchDepositInvoices.mockResolvedValue([]);
    render(<InvoiceHeader data={{ original_invoice_number: "NONEXIST", invoice_type: "final", client_id: "c1" }} onChange={mockOnChange} />);
    await waitFor(() => {
      expect(mockOnChange).not.toHaveBeenCalledWith(expect.objectContaining({ original_invoice_id: expect.anything() }));
    });
  });

  it("handleChange marque le champ comme touché", async () => {
    render(<InvoiceHeader data={{}} onChange={mockOnChange} />);
    const input = screen.getByLabelText(/invoice_number/i);
    fireEvent.change(input, { target: { value: "TCH-001" } });
    await waitFor(() => expect(mockOnChange).toHaveBeenCalled());
  });
});