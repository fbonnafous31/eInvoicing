import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequireNoSeller from "./RequireNoSeller";
import { vi } from "vitest";

const mockNavigate = vi.fn();
const mockFetchMySeller = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../services/sellers", () => ({
  useSellerService: () => ({ fetchMySeller: mockFetchMySeller }),
}));

describe("RequireNoSeller", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockFetchMySeller.mockClear();
  });

  it("affiche le loader au début", () => {
    mockFetchMySeller.mockImplementation(() => new Promise(() => {}));
    render(<RequireNoSeller><p>Formulaire</p></RequireNoSeller>);
    expect(screen.getByText(/Chargement…/)).toBeInTheDocument();
  });

  it("redirige si le vendeur existe", async () => {
    mockFetchMySeller.mockResolvedValue({ id: 123 });
    render(<RequireNoSeller><p>Formulaire</p></RequireNoSeller>);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/seller", { replace: true });
    });
  });

  it("affiche les enfants si pas de vendeur", async () => {
    mockFetchMySeller.mockResolvedValue(null);
    render(<RequireNoSeller><p>Formulaire</p></RequireNoSeller>);
    await waitFor(() => {
      expect(screen.getByText("Formulaire")).toBeInTheDocument();
    });
  });

  it("affiche les enfants si erreur 404", async () => {
    mockFetchMySeller.mockRejectedValue(new Error("404 Not Found"));
    render(<RequireNoSeller><p>Formulaire</p></RequireNoSeller>);
    await waitFor(() => {
      expect(screen.getByText("Formulaire")).toBeInTheDocument();
    });
  });

  it("log l’erreur si autre erreur", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchMySeller.mockRejectedValue(new Error("500 Server Error"));
    render(<RequireNoSeller><p>Formulaire</p></RequireNoSeller>);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(new Error("500 Server Error"));
    });
    consoleSpy.mockRestore();
  });
});
