import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FinanceFields from "./FinanceFields";

describe("FinanceFields", () => {
  const formData = { vat_number: "FR123456789" };
  const errors = {};
  const touched = {};
  const handleChange = vi.fn();
  const handleBlur = vi.fn();

  beforeEach(() => {
    handleChange.mockClear();
    handleBlur.mockClear();
  });

  it("affiche la valeur initiale du champ VAT", () => {
    render(
      <FinanceFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByLabelText(/Numéro de TVA intracommunautaire/i)).toHaveValue(
      formData.vat_number
    );
  });

  it("désactive le champ si disabled est true", () => {
    render(
      <FinanceFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByLabelText(/Numéro de TVA intracommunautaire/i)).toBeDisabled();
  });

  it("appelle handleChange lors de la modification du champ", async () => {
    render(
      <FinanceFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    const user = userEvent.setup();
    const vatField = screen.getByLabelText(/Numéro de TVA intracommunautaire/i);
    await user.clear(vatField);
    await user.type(vatField, "FR987654321");

    expect(handleChange.mock.calls.some(call => call[0] === "vat_number")).toBe(true);
  });

  it("appelle handleBlur lors du blur du champ", async () => {
    render(
      <FinanceFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    const user = userEvent.setup();
    const vatField = screen.getByLabelText(/Numéro de TVA intracommunautaire/i);
    vatField.focus();
    await user.tab(); // déclenche le blur

    expect(handleBlur.mock.calls.some(call => call[0] === "vat_number")).toBe(true);
  });
});
