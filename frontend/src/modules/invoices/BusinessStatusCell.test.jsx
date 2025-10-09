import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import BusinessStatusCell from "./BusinessStatusCell";
import { BUSINESS_STATUSES } from "../../constants/businessStatuses";

describe("BusinessStatusCell", () => {
  it("affiche le label et la couleur correspondant au status existant", () => {
    const row = { business_status: 100 }; // assure que 100 existe dans BUSINESS_STATUSES
    render(<BusinessStatusCell row={row} />);

    const label = BUSINESS_STATUSES[100]?.label || "Non renseigné";
    const color = BUSINESS_STATUSES[100]?.color || "gray";

    const span = screen.getByText(label);
    expect(span).toBeInTheDocument();
    expect(span).toHaveStyle(`background-color: ${color}`);
  });

  it("affiche 'Non renseigné' et couleur grise si status absent ou inconnu", () => {
    const row = { business_status: 9999 }; // code inconnu
    render(<BusinessStatusCell row={row} />);

    const span = screen.getByText("Non renseigné");
    expect(span).toBeInTheDocument();
    expect(span).toHaveStyle("background-color: rgb(128, 128, 128)"); // RGB pour fallback
  });

  it("affiche le commentaire dans le title si getStatusComment fourni", async () => {
    const row = { business_status: 9999 };
    const mockComment = "Commentaire important";
    const getStatusComment = vi.fn().mockResolvedValue(mockComment);

    render(<BusinessStatusCell row={row} getStatusComment={getStatusComment} />);

    await waitFor(() => {
      const span = screen.getByText("Non renseigné");
      expect(span).toHaveAttribute("title", mockComment);
    });

    expect(getStatusComment).toHaveBeenCalled();
  });
});
