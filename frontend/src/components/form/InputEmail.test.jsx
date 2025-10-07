import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputEmail from "./InputEmail";
import * as validators from "@/utils/validators/email";

// Vitest utilise vi.mock au lieu de jest.mock
vi.mock("@/utils/validators/email");

describe("InputEmail", () => {
  it("appelle validateEmail si required=true et touched=true", () => {
    validators.validateEmail.mockReturnValue("Erreur email");

    render(<InputEmail value="abc" touched={true} required={true} />);

    expect(validators.validateEmail).toHaveBeenCalledWith("abc");
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    expect(screen.getByText("Erreur email")).toBeInTheDocument();
  });

  it("n’affiche pas d’erreur si touched=false", () => {
    validators.validateEmail.mockReturnValue("Erreur email");

    render(<InputEmail value="abc" touched={false} required={true} />);

    expect(screen.queryByText("Erreur email")).not.toBeInTheDocument();
  });
});
