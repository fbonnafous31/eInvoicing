import { render, screen, fireEvent } from "@testing-library/react";
import DeleteButton from "./DeleteButton";

describe("DeleteButton", () => {
  it("rend le bouton avec l'emoji et le texte par défaut", () => {
    render(<DeleteButton />);
    const button = screen.getByRole("button", { name: /🗑️ Supprimer/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn btn-danger");
  });

  it("applique les enfants et la classe personnalisés", () => {
    render(<DeleteButton children="Suppr" className="custom" />);
    const button = screen.getByRole("button", { name: /🗑️ Suppr/i });
    expect(button).toHaveClass("btn btn-danger custom");
  });

  it("déclenche onClick lorsque cliqué", () => {
    const onClick = vi.fn();
    render(<DeleteButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
