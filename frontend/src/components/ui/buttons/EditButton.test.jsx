import { render, screen, fireEvent } from "@testing-library/react";
import EditButton from "./EditButton";

describe("EditButton", () => {
  it("rend le bouton avec l'emoji et le texte par défaut", () => {
    render(<EditButton />);
    const button = screen.getByRole("button", { name: /✏️ Modifier/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn btn-primary");
  });

  it("applique les enfants et la classe personnalisés", () => {
    render(<EditButton children="Éditer" className="custom" />);
    const button = screen.getByRole("button", { name: /✏️ Éditer/i });
    expect(button).toHaveClass("btn btn-primary custom");
  });

  it("déclenche onClick lorsque cliqué", () => {
    const onClick = vi.fn();
    render(<EditButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
