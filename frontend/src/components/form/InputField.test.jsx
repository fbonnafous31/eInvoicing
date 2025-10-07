import { render, screen, fireEvent } from "@testing-library/react";
import InputField from "./InputField";

describe("InputField", () => {
  const onChangeMock = vi.fn();
  const onBlurMock = vi.fn();

  beforeEach(() => {
    onChangeMock.mockClear();
    onBlurMock.mockClear();
  });

  it("affiche le label avec astérisque si required=true", () => {
    render(
      <InputField
        label="Nom"
        name="name"
        required={true}
        value=""
      />
    );

    expect(screen.getByLabelText(/Nom \*/)).toBeInTheDocument();
  });

  it("ne rend pas le label si hideLabel=true", () => {
    render(
      <InputField
        label="Nom"
        name="name"
        hideLabel={true}
        value=""
      />
    );

    expect(screen.queryByText("Nom")).not.toBeInTheDocument();
  });

  it("affiche la valeur et le type de l’input", () => {
    render(
      <InputField
        label="Email"
        name="email"
        type="email"
        value="test@example.com"
      />
    );

    const input = screen.getByDisplayValue("test@example.com");
    expect(input).toHaveAttribute("type", "email");
  });

  it("appelle onChange et onBlur", () => {
    render(
      <InputField
        label="Nom"
        name="name"
        value=""
        onChange={onChangeMock}
        onBlur={onBlurMock}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "François" } });
    expect(onChangeMock).toHaveBeenCalledWith("François");

    fireEvent.blur(input);
    expect(onBlurMock).toHaveBeenCalledWith("name");
  });

  it("affiche une erreur si error fourni ou champ requis vide et touched=true", () => {
    render(
      <InputField
        label="Nom"
        name="name"
        required={true}
        touched={true}
        value=""
        error="Nom obligatoire"
      />
    );

    expect(screen.getByText("Nom obligatoire")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveClass("is-invalid");
  });

  it("affiche message par défaut si champ requis vide et touched=true sans error explicite", () => {
    render(
      <InputField
        label="Nom"
        name="name"
        required={true}
        touched={true}
        value=""
      />
    );

    expect(screen.getByText("Ce champ est obligatoire")).toBeInTheDocument();
  });
});
