import { render, screen } from "@testing-library/react";
import SaveButton from "./SaveButton";

describe("SaveButton", () => {
  it("rend le bouton avec le texte et emoji par défaut", () => {
    render(<SaveButton />);
    const button = screen.getByRole("button", { name: /💾 Enregistrer/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("btn btn-primary");
  });

  it("affiche le texte personnalisé et la classe supplémentaire", () => {
    render(<SaveButton className="my-custom-class">Sauver</SaveButton>);
    const button = screen.getByRole("button", { name: /💾 Sauver/i });
    expect(button).toHaveClass("btn btn-primary my-custom-class");
  });
});
