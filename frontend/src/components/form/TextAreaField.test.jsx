import { render, screen, fireEvent } from "@testing-library/react";
import TextAreaField from "./TextAreaField";

describe("TextAreaField", () => {
  it("rend le label et le textarea", () => {
    render(<TextAreaField label="Description" name="desc" />);
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument(); // textarea est textbox
  });

  it("appelle onChange quand on saisit du texte", () => {
    const handleChange = vi.fn();
    render(
      <TextAreaField label="Desc" name="desc" onChange={handleChange} />
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    expect(handleChange).toHaveBeenCalledWith("abc");
  });

  it("appelle onBlur quand le textarea perd le focus", () => {
    const handleBlur = vi.fn();
    render(
      <TextAreaField label="Desc" name="desc" onBlur={handleBlur} />
    );
    fireEvent.blur(screen.getByRole("textbox"));
    expect(handleBlur).toHaveBeenCalledWith("desc");
  });

  it("affiche un message d'erreur si required et touched", () => {
    render(
      <TextAreaField label="Desc" name="desc" required={true} touched={true} />
    );
    expect(screen.getByText("Ce champ est obligatoire")).toBeInTheDocument();
  });

  it("affiche l'erreur passée en prop", () => {
    render(
      <TextAreaField label="Desc" name="desc" error="Erreur perso" />
    );
    expect(screen.getByText("Erreur perso")).toBeInTheDocument();
  });

  it("n'affiche pas d'erreur si valeur renseignée", () => {
    render(
      <TextAreaField label="Desc" name="desc" value="Texte" required={true} touched={true} />
    );
    expect(screen.queryByText("Ce champ est obligatoire")).not.toBeInTheDocument();
  });

  it("applique le nombre de lignes par défaut ou personnalisé", () => {
    const { rerender } = render(<TextAreaField label="Desc" name="desc" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "2");

    rerender(<TextAreaField label="Desc" name="desc" rows={5} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "5");
  });
});
