import { render, screen, fireEvent } from "@testing-library/react";
import CancelButton from "./CancelButton";

describe("CancelButton", () => {
  it("rend le bouton avec l'emoji et le texte par défaut", () => {
    render(<CancelButton />);
    const button = screen.getByRole("button", { name: /❌ Annuler/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn btn-secondary");
  });

  it("applique les enfants et la classe personnalisés", () => {
    render(<CancelButton children="Stop" className="custom" />);
    const button = screen.getByRole("button", { name: /❌ Stop/i });
    expect(button).toHaveClass("btn btn-secondary custom");
  });

  it("déclenche onClick lorsque cliqué", () => {
    const onClick = vi.fn();
    render(<CancelButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
