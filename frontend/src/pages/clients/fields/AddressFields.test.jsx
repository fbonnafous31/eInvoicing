import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressFields from "./AddressFields";

describe("AddressFields", () => {
  const formData = {
    address: "123 rue de Test",
    postal_code: "75001",
    city: "Paris",
    country_code: "FR",
  };
  const touched = {};
  const errors = {};
  const handleChange = vi.fn();
  const handleBlur = vi.fn();
  const countryCodes = [
    { code: "FR", name: "France" },
    { code: "DE", name: "Allemagne" },
  ];

  beforeEach(() => {
    handleChange.mockClear();
    handleBlur.mockClear();
  });

  it("affiche les valeurs correctes dans les champs", () => {
    render(
      <AddressFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
        countryCodes={countryCodes}
      />
    );

    expect(screen.getByLabelText(/Adresse/i)).toHaveValue(formData.address);
    expect(screen.getByLabelText(/Code postal/i)).toHaveValue(formData.postal_code);
    expect(screen.getByLabelText(/Ville/i)).toHaveValue(formData.city);
    expect(screen.getByRole("combobox")).toHaveValue(formData.country_code);
  });

  it("désactive les champs si disabled est true", () => {
    render(
      <AddressFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
        countryCodes={countryCodes}
      />
    );

    expect(screen.getByLabelText(/Adresse/i)).toBeDisabled();
    expect(screen.getByLabelText(/Code postal/i)).toBeDisabled();
    expect(screen.getByLabelText(/Ville/i)).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("appelle handleChange lors de la modification d'un champ", async () => {
    render(
      <AddressFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
        countryCodes={countryCodes}
      />
    );

    const user = userEvent.setup();
    const addressField = screen.getByLabelText(/Adresse/i);
    await user.clear(addressField);
    await user.type(addressField, "Nouvelle adresse");

    // Vérifie qu'au moins un appel a été fait avec "address"
    expect(handleChange.mock.calls.some(call => call[0] === "address")).toBe(true);
  });

  it("appelle handleBlur quand on sort d'un champ", async () => {
    render(
      <AddressFields
        formData={formData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
        countryCodes={countryCodes}
      />
    );

    const user = userEvent.setup();
    const cityField = screen.getByLabelText(/Ville/i);
    cityField.focus();
    await user.tab(); // blur sur le champ suivant

    // Vérifie qu'au moins un appel avec "city" a été fait
    expect(handleBlur.mock.calls.some(call => call[0] === "city")).toBe(true);
  });
});
