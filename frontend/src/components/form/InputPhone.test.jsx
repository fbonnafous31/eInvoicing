import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputPhone from "./InputPhone";
import * as validators from "../../utils/validators/phone_number"; // chemin relatif

// Vitest mock
vi.mock("../../utils/validators/phone_number");

describe("InputPhone", () => {
  it("appelle validatePhoneNumber si touched=true", () => {
    validators.validatePhoneNumber.mockReturnValue("Numéro invalide");

    render(<InputPhone value="0606060606" touched={true} required={true} />);

    expect(validators.validatePhoneNumber).toHaveBeenCalledWith("0606060606");
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "tel");
    expect(screen.getByText("Numéro invalide")).toBeInTheDocument();
  });

  it("n'affiche pas d'erreur si touched=false", () => {
    validators.validatePhoneNumber.mockReturnValue("Numéro invalide");

    render(<InputPhone value="0606060606" touched={false} />);

    expect(screen.queryByText("Numéro invalide")).not.toBeInTheDocument();
  });
});
