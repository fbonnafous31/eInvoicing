import { render, screen, fireEvent } from "@testing-library/react";
import SelectField from "./SelectField";

describe("SelectField", () => {
  const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ];

  it("rend correctement toutes les options", () => {
    render(<SelectField label="Test" name="test" options={options} />);
    expect(screen.getByText("-- Sélectionner --")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("appelle onChange quand on sélectionne une option", () => {
    const handleChange = vi.fn();
    render(
      <SelectField
        label="Test"
        name="test"
        options={options}
        onChange={handleChange}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "opt2" } });
    expect(handleChange).toHaveBeenCalledWith("opt2");
  });

  it("appelle onBlur quand le select perd le focus", () => {
    const handleBlur = vi.fn();
    render(
      <SelectField
        label="Test"
        name="test"
        options={options}
        onBlur={handleBlur}
      />
    );
    fireEvent.blur(screen.getByRole("combobox"));
    expect(handleBlur).toHaveBeenCalledWith("test");
  });

  it("affiche un message d'erreur si required et touched", () => {
    render(
      <SelectField
        label="Test"
        name="test"
        options={options}
        required={true}
        touched={true}
      />
    );
    expect(screen.getByText("Ce champ est obligatoire")).toBeInTheDocument();
  });

  it("affiche l'erreur passée en prop", () => {
    render(
      <SelectField
        label="Test"
        name="test"
        options={options}
        error="Erreur personnalisée"
      />
    );
    expect(screen.getByText("Erreur personnalisée")).toBeInTheDocument();
  });

  it("n'affiche pas d'erreur si valeur sélectionnée", () => {
    render(
      <SelectField
        label="Test"
        name="test"
        options={options}
        value="opt1"
        required={true}
        touched={true}
      />
    );
    expect(screen.queryByText("Ce champ est obligatoire")).not.toBeInTheDocument();
  });
});
