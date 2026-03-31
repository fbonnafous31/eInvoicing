// frontend/src/components/invoices/InvoiceHeader.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import InvoiceHeader from "./InvoiceHeader";
import { validateInvoiceField } from "../../utils/validators/invoice";
import { validateIssueDate } from "../../utils/validators/issueDate";

// ─── Mocks services ───────────────────────────────────────────────────────────

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

// ─── Mocks validators ─────────────────────────────────────────────────────────

vi.mock("../../utils/validators/invoice", () => ({
  validateInvoiceField: vi.fn(() => null),
}));

vi.mock("../../utils/validators/issueDate", () => ({
  validateIssueDate: vi.fn(() => null),
}));

// ─── Mocks constantes ─────────────────────────────────────────────────────────

vi.mock("../../constants/paymentTerms", () => ({
  paymentTermsOptions: [
    { value: "30", label: "30 jours" },
    { value: "60", label: "60 jours" },
  ],
}));

vi.mock("../../constants/paymentMethods", () => ({
  paymentMethodsOptions: [
    { value: "virement", label: "Virement" },
    { value: "cheque", label: "Chèque" },
  ],
}));

vi.mock("../../constants/invoiceTypes", () => ({
  invoiceTypeOptions: [
    { value: "standard", label: "Facture standard" },
    { value: "deposit", label: "Facture d'acompte" },
    { value: "final", label: "Facture de solde" },
    { value: "credit_note", label: "Avoir" },
  ],
}));

// ─── Mocks composants UI ──────────────────────────────────────────────────────

vi.mock("@/components/form", () => ({
  FormSection: ({ children, title }) => (
    <div data-testid={`section-${title}`}>{children}</div>
  ),
  InputField: ({ id, label, value, onChange, onBlur, error, disabled, required, type, min, max, maxLength }) => (
    <div>
      <label htmlFor={id}>{label ?? id}</label>
      <input
        id={id}
        aria-label={label ?? id}
        type={type ?? "text"}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        maxLength={maxLength}
        data-testid={`input-${id}`}
      />
      {error && <span role="alert" data-testid={`error-${id}`}>{error}</span>}
    </div>
  ),
  SelectField: ({ id, label, value, onChange, onBlur, options, disabled, required }) => (
    <div>
      <label htmlFor={id ?? label}>{label}</label>
      <select
        id={id ?? label}
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        data-testid={`select-${id ?? label}`}
      >
        <option value="">-- Choisir --</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ),
  DatePickerField: ({ id, label, value, onChange, onBlur, error, disabled }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-label={label}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        data-testid={`date-${id}`}
      />
      {error && <span role="alert" data-testid={`error-${id}`}>{error}</span>}
    </div>
  ),
  CreatableSelect: ({ id, label, value, onChange, onBlur, options, disabled, error, feedbackText, feedbackClass, placeholder, formatCreateLabel }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        aria-label={label}
        value={value?.value ?? ""}
        onChange={(e) => {
          const opt = options?.find((o) => String(o.value) === e.target.value);
          onChange(opt ?? (e.target.value ? { value: e.target.value, __isNew__: true } : null));
        }}
        onBlur={() => onBlur?.(id)}
        disabled={disabled}
        data-testid={`creatable-${id}`}
      >
        <option value="">-- Choisir --</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span role="alert" data-testid={`error-${id}`}>{error}</span>}
      {feedbackText && <span className={feedbackClass} data-testid="reference-feedback">{feedbackText}</span>}
    </div>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseData = {
  invoice_type: "",
  invoice_number: "",
  issue_date: "",
  fiscal_year: null,
  seller_id: null,
  client_id: null,
  original_invoice_number: "",
  original_invoice_id: null,
  contract_number: "",
  purchase_order_number: "",
  payment_method: "",
  payment_terms: "",
  supply_date: "",
};

const mockDeposits = [
  { id: "dep-1", invoice_number: "AC-001", total: 500, client_name: "Acme" },
  { id: "dep-2", invoice_number: "AC-002", total: 1200, client_name: "Beta" },
];

const mockAllInvoices = [
  { id: "inv-1", invoice_number: "FA-001", total: 800 },
  { id: "inv-2", invoice_number: "FA-002", total: 3000 },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderHeader(dataOverrides = {}, props = {}) {
  const onChange = props.onChange ?? vi.fn();
  const utils = render(
    <InvoiceHeader
      data={{ ...baseData, ...dataOverrides }}
      onChange={onChange}
      submitted={props.submitted ?? false}
      errors={props.errors ?? {}}
      disabled={props.disabled ?? false}
    />
  );
  return { ...utils, onChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InvoiceHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMySeller.mockResolvedValue({ id: 42 });
    mockFetchInvoicesBySeller.mockResolvedValue(mockAllInvoices);
    mockFetchDepositInvoices.mockResolvedValue(mockDeposits);
  });

  // ── Rendu de base ────────────────────────────────────────────────────────

  describe("Rendu de base", () => {
    it("affiche les champs fondamentaux", async () => {
      renderHeader();
      await waitFor(() => {
        expect(screen.getByLabelText("Référence facture")).toBeInTheDocument();
        expect(screen.getByLabelText("Date émission")).toBeInTheDocument();
        expect(screen.getByLabelText("Exercice fiscal")).toBeInTheDocument();
        expect(screen.getByLabelText("Date de livraison")).toBeInTheDocument();
        expect(screen.getByLabelText("Moyen de paiement")).toBeInTheDocument();
        expect(screen.getByLabelText("Conditions de paiement")).toBeInTheDocument();
      });
    });

    it("n'affiche pas le champ de référence origine par défaut (type standard)", async () => {
      renderHeader({ invoice_type: "standard" });
      await waitFor(() => {
        expect(screen.queryByTestId("creatable-original_invoice_number")).not.toBeInTheDocument();
      });
    });
  });

  // ── Auto-fill seller_id ──────────────────────────────────────────────────

  describe("Auto-fill seller_id", () => {
    it("injecte le seller_id depuis fetchMySeller si absent", async () => {
      const { onChange } = renderHeader({ seller_id: null });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ seller_id: 42 })
        )
      );
    });

    it("ne remplace pas un seller_id déjà présent", async () => {
      const { onChange } = renderHeader({ seller_id: 99 });
      await waitFor(() => expect(mockFetchMySeller).toHaveBeenCalled());
      // onChange peut être appelé pour d'autres raisons, mais jamais avec seller_id: 42
      const calls = onChange.mock.calls;
      calls.forEach((call) => {
        if (call[0].seller_id !== undefined) {
          expect(call[0].seller_id).toBe(99);
        }
      });
    });

    it("gère silencieusement une erreur de fetchMySeller", async () => {
      mockFetchMySeller.mockRejectedValueOnce(new Error("Réseau indisponible"));
      // Aucun crash attendu
      expect(() => renderHeader()).not.toThrow();
      await waitFor(() => expect(mockFetchMySeller).toHaveBeenCalled());
    });
  });

  // ── Chargement des factures ───────────────────────────────────────────────

  describe("Chargement des factures", () => {
    it("appelle fetchInvoicesBySeller au montage", async () => {
      renderHeader();
      await waitFor(() => expect(mockFetchInvoicesBySeller).toHaveBeenCalledTimes(1));
    });

    it("appelle fetchDepositInvoices avec le client_id", async () => {
      renderHeader({ client_id: "cli-42" });
      await waitFor(() =>
        expect(mockFetchDepositInvoices).toHaveBeenCalledWith("cli-42")
      );
    });

    it("rappelle fetchDepositInvoices quand client_id change", async () => {
      const { rerender } = renderHeader({ client_id: "cli-1" });
      await waitFor(() => expect(mockFetchDepositInvoices).toHaveBeenCalledWith("cli-1"));

      rerender(
        <InvoiceHeader
          data={{ ...baseData, client_id: "cli-2" }}
          onChange={vi.fn()}
          submitted={false}
          errors={{}}
        />
      );
      await waitFor(() =>
        expect(mockFetchDepositInvoices).toHaveBeenCalledWith("cli-2")
      );
    });

    it("gère silencieusement une erreur de fetchInvoicesBySeller", async () => {
      mockFetchInvoicesBySeller.mockRejectedValueOnce(new Error("500"));
      expect(() => renderHeader()).not.toThrow();
      await waitFor(() => expect(mockFetchInvoicesBySeller).toHaveBeenCalled());
    });

    it("gère silencieusement une erreur de fetchDepositInvoices", async () => {
      mockFetchDepositInvoices.mockRejectedValueOnce(new Error("404"));
      expect(() => renderHeader({ client_id: "cli-1" })).not.toThrow();
      await waitFor(() => expect(mockFetchDepositInvoices).toHaveBeenCalled());
    });
  });

  // ── Raccordement automatique de la facture d'origine ─────────────────────

  describe("Raccordement automatique original_invoice_id", () => {
    it("raccorde l'ID et le montant si la référence correspond à une facture d'acompte", async () => {
      const { onChange } = renderHeader({
        invoice_type: "final",
        client_id: "cli-1",
        original_invoice_number: "AC-001",
        original_invoice_id: null,
      });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            original_invoice_id: "dep-1",
            deposit_amount: 500,
          })
        )
      );
    });

    it("raccorde depuis allInvoices pour un avoir", async () => {
      const { onChange } = renderHeader({
        invoice_type: "credit_note",
        original_invoice_number: "FA-001",
        original_invoice_id: null,
      });
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ original_invoice_id: "inv-1" })
        )
      );
    });

    it("ne rappelle pas onChange si original_invoice_id est déjà présent", async () => {
      const { onChange } = renderHeader({
        invoice_type: "final",
        client_id: "cli-1",
        original_invoice_number: "AC-001",
        original_invoice_id: "dep-1",
      });
      // L'effet passe directement en 'found', aucun appel onChange attendu pour l'ID
      await waitFor(() => expect(mockFetchDepositInvoices).toHaveBeenCalled());
      const idCalls = onChange.mock.calls.filter(
        (c) => c[0].original_invoice_id !== undefined && c[0].original_invoice_id !== "dep-1"
      );
      expect(idCalls).toHaveLength(0);
    });

    it("ne raccorde rien si la référence est vide", async () => {
      const { onChange } = renderHeader({
        invoice_type: "final",
        client_id: "cli-1",
        original_invoice_number: "",
        original_invoice_id: null,
      });
      await waitFor(() => expect(mockFetchDepositInvoices).toHaveBeenCalled());
      const idCalls = onChange.mock.calls.filter((c) => c[0].original_invoice_id != null);
      expect(idCalls).toHaveLength(0);
    });

    it("affiche le feedback '✅ Facture correspondante trouvée' si raccordée", async () => {
      renderHeader({
        invoice_type: "final",
        client_id: "cli-1",
        original_invoice_number: "AC-001",
        original_invoice_id: null,
      });
      await waitFor(() =>
        expect(screen.getByTestId("reference-feedback")).toHaveTextContent(
          "✅ Facture correspondante trouvée"
        )
      );
    });
  });

  // ── handleChange ─────────────────────────────────────────────────────────

  describe("handleChange", () => {
    it("propage la valeur saisie dans invoice_number", async () => {
      const { onChange } = renderHeader();
      await waitFor(() => screen.getByTestId("input-invoice_number"));
      fireEvent.change(screen.getByTestId("input-invoice_number"), {
        target: { value: "FA-2024-001" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ invoice_number: "FA-2024-001" })
      );
    });

    it("calcule fiscal_year automatiquement depuis issue_date", async () => {
      const { onChange } = renderHeader();
      await waitFor(() => screen.getByTestId("date-issue_date"));
      fireEvent.change(screen.getByTestId("date-issue_date"), {
        target: { value: "2024-06-15" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ issue_date: "2024-06-15", fiscal_year: 2024 })
      );
    });

    it("ne marque pas seller_id comme touché lors de l'auto-fill", async () => {
      // seller_id est rempli automatiquement : validateField ne doit pas y être appelé
      // On vérifie que validateInvoiceField n'est pas appelé pour seller_id
      renderHeader({ seller_id: null });
      await waitFor(() => expect(mockFetchMySeller).toHaveBeenCalled());
      const sellerValidations = vi.mocked(validateInvoiceField).mock.calls.filter(
        (c) => c[0] === "seller_id"
      );
      expect(sellerValidations).toHaveLength(0);
    });

    it("propage un changement de type de facture", async () => {
      const { onChange } = renderHeader();
      await waitFor(() => screen.getByTestId("select-invoice_type"));
      fireEvent.change(screen.getByTestId("select-invoice_type"), {
        target: { value: "deposit" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ invoice_type: "deposit" })
      );
    });

    it("propage le moyen de paiement sélectionné", async () => {
      const { onChange } = renderHeader();
      await waitFor(() => screen.getByLabelText("Moyen de paiement"));
      fireEvent.change(screen.getByLabelText("Moyen de paiement"), {
        target: { value: "virement" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: "virement" })
      );
    });

    it("propage les conditions de paiement sélectionnées", async () => {
      const { onChange } = renderHeader();
      await waitFor(() => screen.getByLabelText("Conditions de paiement"));
      fireEvent.change(screen.getByLabelText("Conditions de paiement"), {
        target: { value: "30" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ payment_terms: "30" })
      );
    });
  });

  // ── CreatableSelect — sélection de la facture d'origine ──────────────────

  describe("CreatableSelect original_invoice_number", () => {
    it("sélectionne une facture d'acompte existante depuis la liste", async () => {
      const { onChange } = renderHeader({
        invoice_type: "final",
        client_id: "cli-1",
      });
      await waitFor(() => screen.getByTestId("creatable-original_invoice_number"));
      fireEvent.change(screen.getByTestId("creatable-original_invoice_number"), {
        target: { value: "dep-1" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          original_invoice_id: "dep-1",
          original_invoice_number: "AC-001",
        })
      );
    });

    it("efface original_invoice_id et original_invoice_number si on vide la sélection", async () => {
      const { onChange } = renderHeader({
        invoice_type: "final",
        client_id: "cli-1",
        original_invoice_number: "AC-001",
        original_invoice_id: "dep-1",
      });
      await waitFor(() => screen.getByTestId("creatable-original_invoice_number"));
      fireEvent.change(screen.getByTestId("creatable-original_invoice_number"), {
        target: { value: "" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          original_invoice_number: "",
          original_invoice_id: null,
        })
      );
    });
  });

  // ── Validation ───────────────────────────────────────────────────────────

  describe("Validation des champs", () => {
    it("n'affiche pas les erreurs sur un champ non touché sans soumission", async () => {
      vi.mocked(validateInvoiceField).mockReturnValue("Champ requis");
      renderHeader();
      // Pas de blur → champ non touché → pas d'erreur visible
      await waitFor(() => screen.getByTestId("input-invoice_number"));
      expect(screen.queryByTestId("error-invoice_number")).not.toBeInTheDocument();
    });

    it("affiche les erreurs passées via la prop errors quand submitted=true", async () => {
      renderHeader(
        { invoice_number: "" },
        { submitted: true, errors: { invoice_number: "La référence est obligatoire" } }
      );
      await waitFor(() =>
        expect(screen.getByTestId("error-invoice_number")).toHaveTextContent(
          "La référence est obligatoire"
        )
      );
    });

    it("n'affiche pas les erreurs de la prop errors si submitted=false", async () => {
      renderHeader(
        { invoice_number: "" },
        { submitted: false, errors: { invoice_number: "La référence est obligatoire" } }
      );
      await waitFor(() => screen.getByTestId("input-invoice_number"));
      expect(screen.queryByTestId("error-invoice_number")).not.toBeInTheDocument();
    });
  });

  // ── Mode disabled ────────────────────────────────────────────────────────

  describe("Mode disabled", () => {
    it("désactive tous les champs de saisie quand disabled=true", async () => {
      renderHeader(
        {
          invoice_type: "standard",
          invoice_number: "FA-001",
          issue_date: "2024-01-01",
          fiscal_year: 2024,
          payment_method: "virement",
          payment_terms: "30",
        },
        { disabled: true }
      );
      await waitFor(() => {
        screen.getAllByRole("textbox").forEach((input) =>
          expect(input).toBeDisabled()
        );
        screen.getAllByRole("combobox").forEach((select) =>
          expect(select).toBeDisabled()
        );
      });
    });
  });
});