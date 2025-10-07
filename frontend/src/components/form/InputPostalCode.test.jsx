import { render, screen } from "@testing-library/react";
import InputPostalCode from "./InputPostalCode";
import * as validators from "@/utils/validators/postal_code"; // adapter le chemin selon ton projet

// Vitest mock
vi.mock("@/utils/validators/postal_code");

describe("InputPostalCode", () => {
  it("appelle isValidPostalCode et affiche une erreur si invalide", () => {
    validators.isValidPostalCode.mockReturnValue(false);

    render(<InputPostalCode value="123" touched={true} required={true} />);

    expect(validators.isValidPostalCode).toHaveBeenCalledWith("123");
    expect(screen.getByText("Code postal invalide")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  it("affiche un message obligatoire si required=true et valeur vide", () => {
    render(<InputPostalCode value="" touched={true} required={true} />);

    expect(screen.getByText("Le code postal est obligatoire")).toBeInTheDocument();
  });

  it("n’affiche pas d’erreur si touched=false et submitted=false", () => {
    validators.isValidPostalCode.mockReturnValue(false);

    render(<InputPostalCode value="123" touched={false} submitted={false} required={true} />);
    expect(screen.queryByText("Code postal invalide")).not.toBeInTheDocument();
    expect(screen.queryByText("Le code postal est obligatoire")).not.toBeInTheDocument();
  });

  it("n’affiche pas d’erreur si code postal valide", () => {
    validators.isValidPostalCode.mockReturnValue(true);

    render(<InputPostalCode value="75001" touched={true} required={true} />);
    expect(screen.queryByText("Code postal invalide")).not.toBeInTheDocument();
    expect(screen.queryByText("Le code postal est obligatoire")).not.toBeInTheDocument();
  });
});
