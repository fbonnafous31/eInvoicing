// LegalFields.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LegalFields from "./LegalFields";

// ─── Mock des composants InputField et InputSiret ──────────────────────────────
vi.mock('@/components/form', async () => {
  const actual = await vi.importActual('@/components/form');
  return {
    ...actual,
    InputField: ({ value, onChange, onBlur, id, disabled }) => (
      <input
        id={id}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        data-testid={id}
      />
    ),
    InputSiret: ({ value, onChange, onBlur, id, disabled }) => (
      <input
        id={id}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        data-testid={id}
      />
    ),
  };
});

describe("LegalFields", () => {
  const handleChange = vi.fn();
  const handleBlur = vi.fn();
  const errors = {};
  const touched = {};

  const companyFormData = {
    is_company: true,
    legal_name: "Ma Société",
    siret: "12345678901234",
    country_code: "FR",
    firstname: "",
    lastname: "",
  };

  const individualFormData = {
    is_company: false,
    legal_name: "",
    siret: "",
    country_code: "FR",
    firstname: "Jean",
    lastname: "Dupont",
  };

  beforeEach(() => {
    handleChange.mockClear();
    handleBlur.mockClear();
  });

  it("affiche les champs entreprise si is_company=true", () => {
    render(
      <LegalFields
        formData={companyFormData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    // Radios
    expect(screen.getByLabelText("Entreprise")).toBeChecked();
    expect(screen.getByLabelText("Particulier")).not.toBeChecked();

    // Champs entreprise
    expect(screen.getByTestId("legal_name")).toHaveValue(companyFormData.legal_name);
    expect(screen.getByTestId("siret")).toHaveValue(companyFormData.siret);
  });

  it("affiche les champs particulier si is_company=false", () => {
    render(
      <LegalFields
        formData={individualFormData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    // Radios
    expect(screen.getByLabelText("Entreprise")).not.toBeChecked();
    expect(screen.getByLabelText("Particulier")).toBeChecked();

    // Champs particulier
    expect(screen.getByTestId("firstname")).toHaveValue(individualFormData.firstname);
    expect(screen.getByTestId("lastname")).toHaveValue(individualFormData.lastname);
  });

  it("désactive tous les champs si disabled=true", () => {
    render(
      <LegalFields
        formData={companyFormData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByLabelText("Entreprise")).toBeDisabled();
    expect(screen.getByLabelText("Particulier")).toBeDisabled();
    expect(screen.getByTestId("legal_name")).toBeDisabled();
    expect(screen.getByTestId("siret")).toBeDisabled();
  });

  it("blur des inputs appelle handleBlur", () => {
    render(
      <LegalFields
        formData={companyFormData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    const legalInput = screen.getByTestId("legal_name");
    fireEvent.blur(legalInput);
    expect(handleBlur).toHaveBeenCalledWith("legal_name");

    const siretInput = screen.getByTestId("siret");
    fireEvent.blur(siretInput);
    expect(handleBlur).toHaveBeenCalledWith("siret");
  });

  it("changer le type de client appelle handleChange", async () => {
    render(
      <LegalFields
        formData={{ ...companyFormData, is_company: false }}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    const radioEntreprise = screen.getByLabelText("Entreprise");
    await userEvent.click(radioEntreprise);
    expect(handleChange).toHaveBeenCalledWith("is_company", true);
  });
});