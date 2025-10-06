import { render, screen } from "@testing-library/react";
import EllipsisCell from "./EllipsisCell";

describe("EllipsisCell", () => {
  it("affiche la valeur passée", () => {
    render(<EllipsisCell value="Hello World" />);
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("ajoute un title si le texte est tronqué", () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, value: 300 });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 100 });

    render(<EllipsisCell value="Texte très long" />);
    const span = screen.getByText("Texte très long");
    expect(span).toHaveAttribute("title", "Texte très long");

    // restore
    if (original) Object.defineProperty(HTMLElement.prototype, "scrollWidth", original);
  });

  it("ne met pas de title si le texte n'est pas tronqué", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, value: 100 });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 200 });

    render(<EllipsisCell value="Court" />);
    const span = screen.getByText("Court");
    expect(span).not.toHaveAttribute("title");
  });
});
