// frontend/src/components/invoices/InvoiceClient.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvoiceClient from "./InvoiceClient.jsx";

const mockClients = [
  { id: 1, firstname: "John", lastname: "Doe", legal_name: "John Doe" },
  { id: 2, firstname: "Jane", lastname: "Smith", legal_name: "Jane Smith" },
];

vi.mock("@/services/clients", () => ({
  useClientService: () => ({
    fetchClients: vi.fn().mockResolvedValue(mockClients)
  })
}));

describe("InvoiceClient", () => {
  it("rend le composant sans erreur", async () => {
    const onChange = vi.fn();
    render(<InvoiceClient value={{}} onChange={onChange} />);

    // React-Select n'a pas de placeholder "input" classique => on vérifie le texte visible
    await waitFor(() => {
      expect(screen.getByText("Rechercher un client...")).toBeInTheDocument();
    });
  });

  it("sélectionne un client et appelle onChange", async () => {
    const onChange = vi.fn();
    render(<InvoiceClient value={{}} onChange={onChange} />);

    // Ouvre le dropdown React-Select
    const dropdown = screen.getByText("Rechercher un client...");
    fireEvent.mouseDown(dropdown);

    // Clique sur John Doe
    await waitFor(() => {
      fireEvent.click(screen.getByText("John Doe"));
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ client_id: 1, client_first_name: "John", client_last_name: "Doe" })
      );
    });
  });
});
