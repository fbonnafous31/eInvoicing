import { render, screen } from "@testing-library/react";
import InputSiret from "./InputSiret";
import * as validators from "@/utils/validators/siret";

// Mock du validator
vi.mock("@/utils/validators/siret");

describe("InputSiret", () => {
  it("affiche une erreur si SIRET invalide", () => {
    validators.isValidSiret.mockReturnValue(false);

    render(<InputSiret value="123" touched={true} required={true} />);

    expect(validators.isValidSiret).toHaveBeenCalledWith("123");
    expect(screen.getByText("SIRET invalide")).toBeInTheDocument();
  });

  it("affiche un message obligatoire si required=true et valeur vide", () => {
    render(<InputSiret value="" touched={true} required={true} />);

    expect(screen.getByText("Le SIRET est obligatoire")).toBeInTheDocument();
  });

  it("n’affiche pas d’erreur si SIRET valide", () => {
    validators.isValidSiret.mockReturnValue(true);

    render(<InputSiret value="12345678901234" touched={true} required={true} />);
    expect(screen.queryByText("SIRET invalide")).not.toBeInTheDocument();
    expect(screen.queryByText("Le SIRET est obligatoire")).not.toBeInTheDocument();
  });

  it("priorise l’erreur passée en prop", () => {
    render(<InputSiret value="123" touched={true} required={true} error="Erreur personnalisée" />);
    expect(screen.getByText("Erreur personnalisée")).toBeInTheDocument();
  });
});
