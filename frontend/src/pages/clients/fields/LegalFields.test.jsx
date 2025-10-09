import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LegalFields from "./LegalFields";

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

    // Radio buttons
    expect(screen.getByLabelText("Entreprise")).toBeChecked();
    expect(screen.getByLabelText("Particulier")).not.toBeChecked();

    // Champs entreprise
    expect(screen.getByLabelText("Nom légal *")).toHaveValue(companyFormData.legal_name);
    expect(screen.getByLabelText("SIRET")).toHaveValue(companyFormData.siret);
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

    // Radio buttons
    expect(screen.getByLabelText("Entreprise")).not.toBeChecked();
    expect(screen.getByLabelText("Particulier")).toBeChecked();

    // Champs particulier
    expect(screen.getByLabelText("Prénom *")).toHaveValue(individualFormData.firstname);
    expect(screen.getByLabelText("Nom *")).toHaveValue(individualFormData.lastname);
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

    // Radios et inputs
    expect(screen.getByLabelText("Entreprise")).toBeDisabled();
    expect(screen.getByLabelText("Particulier")).toBeDisabled();
    expect(screen.getByLabelText("Nom légal *")).toBeDisabled();
    expect(screen.getByLabelText("SIRET")).toBeDisabled();
  });
});
