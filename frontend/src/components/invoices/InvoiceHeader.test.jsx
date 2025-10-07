import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvoiceHeader from "./InvoiceHeader";

const mockOnChange = vi.fn();
const mockFetchMySeller = vi.fn();

vi.mock("../../services/sellers", () => ({
  useSellerService: () => ({ fetchMySeller: mockFetchMySeller }),
}));

vi.mock("../../utils/validators/invoice", () => ({
  validateInvoiceField: vi.fn(() => null),
}));

vi.mock("../../utils/validators/issueDate", () => ({
  validateIssueDate: vi.fn(() => null),
}));

describe("InvoiceHeader", () => {
  beforeEach(() => {
    mockOnChange.mockClear();
    mockFetchMySeller.mockClear();
  });

  it("affiche tous les champs avec valeurs par défaut", async () => {
    render(<InvoiceHeader data={{}} onChange={mockOnChange} />);
    expect(screen.getByLabelText(/Référence facture/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date émission/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exercice fiscal/i)).toBeInTheDocument();
  });

  it("appelle onChange et valide le champ quand modifié", async () => {
    render(<InvoiceHeader data={{}} onChange={mockOnChange} />);
    const invoiceInput = screen.getByLabelText(/Référence facture/i);
    fireEvent.change(invoiceInput, { target: { value: "INV123" } });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it("auto-fill seller_id si vide", async () => {
    mockFetchMySeller.mockResolvedValue({ id: 42 });
    render(<InvoiceHeader data={{}} onChange={mockOnChange} />);
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ seller_id: 42 }));
    });
  });
});
