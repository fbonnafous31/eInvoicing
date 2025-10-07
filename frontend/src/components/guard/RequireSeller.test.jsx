import { render, screen, waitFor } from "@testing-library/react";
import RequireSeller from "./RequireSeller";
import { vi } from "vitest";

const mockNavigate = vi.fn();
const mockFetchMySeller = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/services/sellers", () => ({
  useSellerService: () => ({ fetchMySeller: mockFetchMySeller }),
}));

describe("RequireSeller", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockFetchMySeller.mockClear();
  });

  it("affiche le loader au début", () => {
    mockFetchMySeller.mockImplementation(() => new Promise(() => {}));
    render(<RequireSeller><p>Contenu</p></RequireSeller>);
    expect(screen.getByText(/Chargement du profil vendeur…/)).toBeInTheDocument();
  });

  it("redirige vers création si pas de vendeur", async () => {
    mockFetchMySeller.mockResolvedValue(null);
    render(<RequireSeller><p>Contenu</p></RequireSeller>);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/sellers/new");
    });
  });

  it("redirige vers création si erreur fetchMySeller", async () => {
    const error = new Error("500 Server Error");
    mockFetchMySeller.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<RequireSeller><p>Contenu</p></RequireSeller>);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/sellers/new");
      expect(consoleSpy).toHaveBeenCalledWith("Erreur fetchMySeller:", error);
    });
    consoleSpy.mockRestore();
  });

  it("affiche les enfants si le vendeur existe", async () => {
    mockFetchMySeller.mockResolvedValue({ id: 123 });
    render(<RequireSeller><p>Contenu</p></RequireSeller>);
    await waitFor(() => {
      expect(screen.getByText("Contenu")).toBeInTheDocument();
    });
  });
});
