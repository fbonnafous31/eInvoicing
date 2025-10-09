import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactFields from "./ContactFields";

describe("ContactFields", () => {
  const formData = {
    email: "test@example.com",
    phone: "0601020304",
  };
  const touched = {};
  const handleChange = vi.fn();
  const handleBlur = vi.fn();

  beforeEach(() => {
    handleChange.mockClear();
    handleBlur.mockClear();
  });

  it("affiche les valeurs correctes dans les champs", () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByLabelText(/Email/i)).toHaveValue(formData.email);
    expect(screen.getByLabelText(/Téléphone/i)).toHaveValue(formData.phone);
  });

  it("désactive les champs si disabled est true", () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByLabelText(/Email/i)).toBeDisabled();
    expect(screen.getByLabelText(/Téléphone/i)).toBeDisabled();
  });

  it("appelle handleChange lors de la modification d'un champ", async () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    const user = userEvent.setup();
    const emailField = screen.getByLabelText(/Email/i);
    await user.clear(emailField);
    await user.type(emailField, "new@test.com");

    expect(handleChange.mock.calls.some(call => call[0] === "email")).toBe(true);
  });

  it("appelle handleBlur quand on sort d'un champ", async () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    const user = userEvent.setup();
    const phoneField = screen.getByLabelText(/Téléphone/i);
    phoneField.focus();
    await user.tab(); // blur sur le champ suivant

    expect(handleBlur.mock.calls.some(call => call[0] === "phone")).toBe(true);
  });
});
