import { render, screen, fireEvent } from "@testing-library/react";
import SmallDeleteButton from "./SmallDeleteButton";

describe("SmallDeleteButton", () => {
  it("rend le bouton avec l'emoji et la classe correcte", () => {
    render(<SmallDeleteButton />);
    const button = screen.getByRole("button", { name: /🗑️/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn btn-sm btn-danger p-1");
    expect(button).toHaveAttribute("title", "Supprimer");
    expect(button).not.toBeDisabled();
  });

  it("applique le disabled et le title personnalisés", () => {
    render(<SmallDeleteButton disabled title="Retirer" />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Retirer");
  });

  it("déclenche onClick lorsque cliqué et non désactivé", () => {
    const onClick = vi.fn();
    render(<SmallDeleteButton onClick={onClick} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("ne déclenche pas onClick lorsque désactivé", () => {
    const onClick = vi.fn();
    render(<SmallDeleteButton onClick={onClick} disabled />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
