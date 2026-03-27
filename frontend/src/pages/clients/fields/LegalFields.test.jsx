// LegalFields.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LegalFields from "./LegalFields";

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

  // ─── Tests existants ────────────────────────────────────────────────────────

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

    expect(screen.getByLabelText("Entreprise")).toBeChecked();
    expect(screen.getByLabelText("Particulier")).not.toBeChecked();
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

    expect(screen.getByLabelText("Entreprise")).not.toBeChecked();
    expect(screen.getByLabelText("Particulier")).toBeChecked();
    expect(screen.getByTestId("firstname")).toHaveValue(individualFormData.firstname);
    expect(screen.getByTestId("lastname")).toHaveValue(individualFormData.lastname);
  });

  it("désactive tous les champs si disabled=true (mode entreprise)", () => {
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

    fireEvent.blur(screen.getByTestId("legal_name"));
    expect(handleBlur).toHaveBeenCalledWith("legal_name");

    fireEvent.blur(screen.getByTestId("siret"));
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

    await userEvent.click(screen.getByLabelText("Entreprise"));
    expect(handleChange).toHaveBeenCalledWith("is_company", true);
  });

  // ─── Nouveaux tests ─────────────────────────────────────────────────────────

  it("masque le champ SIRET si country_code !== 'FR'", () => {
    render(
      <LegalFields
        formData={{ ...companyFormData, country_code: "DE" }}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.queryByTestId("siret")).not.toBeInTheDocument();
    expect(screen.getByTestId("legal_name")).toBeInTheDocument();
  });

  it("affiche le champ SIRET si country_code === 'FR'", () => {
    render(
      <LegalFields
        formData={{ ...companyFormData, country_code: "FR" }}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByTestId("siret")).toBeInTheDocument();
  });

  it("modifier legal_name appelle handleChange avec la bonne valeur", async () => {
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

    await userEvent.clear(screen.getByTestId("legal_name"));
    await userEvent.type(screen.getByTestId("legal_name"), "Nouvelle Société");
    expect(handleChange).toHaveBeenCalledWith("legal_name", expect.any(String));
  });

  it("modifier siret appelle handleChange avec la bonne valeur", async () => {
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

    await userEvent.clear(screen.getByTestId("siret"));
    await userEvent.type(screen.getByTestId("siret"), "98765432100012");
    expect(handleChange).toHaveBeenCalledWith("siret", expect.any(String));
  });

  it("modifier firstname et lastname appelle handleChange", async () => {
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

    await userEvent.clear(screen.getByTestId("firstname"));
    await userEvent.type(screen.getByTestId("firstname"), "Marie");
    expect(handleChange).toHaveBeenCalledWith("firstname", expect.any(String));

    await userEvent.clear(screen.getByTestId("lastname"));
    await userEvent.type(screen.getByTestId("lastname"), "Martin");
    expect(handleChange).toHaveBeenCalledWith("lastname", expect.any(String));
  });

  it("blur de firstname et lastname appelle handleBlur", () => {
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

    fireEvent.blur(screen.getByTestId("firstname"));
    expect(handleBlur).toHaveBeenCalledWith("firstname");

    fireEvent.blur(screen.getByTestId("lastname"));
    expect(handleBlur).toHaveBeenCalledWith("lastname");
  });

  it("désactive les champs particulier si disabled=true", () => {
    render(
      <LegalFields
        formData={individualFormData}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByLabelText("Entreprise")).toBeDisabled();
    expect(screen.getByLabelText("Particulier")).toBeDisabled();
    expect(screen.getByTestId("firstname")).toBeDisabled();
    expect(screen.getByTestId("lastname")).toBeDisabled();
  });

  it("passer à Particulier appelle handleChange avec false", async () => {
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

    await userEvent.click(screen.getByLabelText("Particulier"));
    expect(handleChange).toHaveBeenCalledWith("is_company", false);
  });

  it("passe les erreurs et touched aux champs entreprise", () => {
    const errorsWithData = { legal_name: "Champ requis", siret: "SIRET invalide" };
    const touchedWithData = { legal_name: true, siret: true };

    render(
      <LegalFields
        formData={companyFormData}
        errors={errorsWithData}
        touched={touchedWithData}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByTestId("legal_name")).toBeInTheDocument();
    expect(screen.getByTestId("siret")).toBeInTheDocument();
  });

  it("passe les erreurs et touched aux champs particulier", () => {
    const errorsWithData = { firstname: "Prénom requis", lastname: "Nom requis" };
    const touchedWithData = { firstname: true, lastname: true };

    render(
      <LegalFields
        formData={individualFormData}
        errors={errorsWithData}
        touched={touchedWithData}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByTestId("firstname")).toBeInTheDocument();
    expect(screen.getByTestId("lastname")).toBeInTheDocument();
  });
});