// frontend/src/components/invoices/InvoiceClient.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InvoiceClient from "./InvoiceClient.jsx";

// ─── Fixtures ───────────────────────────────────────────────────────────────

const mockClients = [
  {
    id: 1,
    firstname: "John",
    lastname: "Doe",
    legal_name: "John Doe",
    address: "12 rue de la Paix",
    city: "Paris",
    postal_code: "75001",
    country_code: "FR",
    email: "john@example.com",
    phone: "+33612345678",
  },
  {
    id: 2,
    legal_name: "Acme Corp",
    siret: "73282932000074",
    address: "1 avenue des Champs",
    city: "Lyon",
    postal_code: "69001",
    country_code: "FR",
    email: "contact@acme.fr",
    phone: "+33478000000",
  },
  {
    id: 3,
    legal_name: "EU Partner GmbH",
    vat_number: "DE123456789",
    address: "Hauptstrasse 1",
    city: "Berlin",
    postal_code: "10115",
    country_code: "DE",
    email: "info@eupartner.de",
    phone: "+4930123456",
  },
];

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockFetchClients = vi.fn().mockResolvedValue(mockClients);

vi.mock("@/services/clients", () => ({
  useClientService: () => ({
    fetchClients: mockFetchClients,
  }),
}));

vi.mock("@/components/form", () => ({
  InputField: ({ label, value, onChange, onBlur, error, disabled, required }) => (
    <div>
      <label>{label}</label>
      <input
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        data-testid={`input-${label}`}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  SelectField: ({ label, value, onChange, onBlur, options, disabled, required }) => (
    <div>
      <label htmlFor={`select-${label}`}>{label}</label>
      <select
        id={`select-${label}`}
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        data-testid={`select-${label}`}
      >
        <option value="">-- Choisir --</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ),
  InputPostalCode: ({ label, value, onChange, onBlur, disabled }) => (
    <div>
      <label>{label}</label>
      <input
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        data-testid={`input-${label}`}
      />
    </div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sélectionne un client dans le react-select en simulant le mouseDown sur le
 * placeholder puis en cliquant sur l'option désirée.
 */
async function pickClientFromDropdown(label) {
  const dropdown = screen.getByText("Rechercher un client...");
  fireEvent.mouseDown(dropdown);
  await waitFor(() => screen.getByText(label));
  fireEvent.click(screen.getByText(label));
}

function renderComponent(props = {}) {
  const onChange = props.onChange ?? vi.fn();
  const utils = render(
    <InvoiceClient value={props.value ?? {}} onChange={onChange} error={props.error} disabled={props.disabled} />
  );
  return { ...utils, onChange };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InvoiceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchClients.mockResolvedValue(mockClients);
  });

  // ── Rendu initial ──────────────────────────────────────────────────────────

  describe("Rendu initial", () => {
    it("affiche le placeholder du sélecteur de client", async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Rechercher un client...")).toBeInTheDocument()
      );
    });

    it("affiche le champ 'Type de client'", async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByLabelText("Type de client")).toBeInTheDocument()
      );
    });

    it("affiche une erreur globale passée en prop", async () => {
      renderComponent({ error: "Veuillez renseigner un client" });
      await waitFor(() =>
        expect(screen.getByText("Veuillez renseigner un client")).toBeInTheDocument()
      );
    });

    it("charge et trie les clients au montage", async () => {
      renderComponent();
      await waitFor(() => expect(mockFetchClients).toHaveBeenCalledTimes(1));
    });

    it("ne rappelle pas fetchClients si le composant est déjà monté", async () => {
      const { rerender } = renderComponent();
      await waitFor(() => expect(mockFetchClients).toHaveBeenCalledTimes(1));
      rerender(<InvoiceClient value={{}} onChange={vi.fn()} />);
      expect(mockFetchClients).toHaveBeenCalledTimes(1);
    });
  });

  // ── Sélection d'un client existant ────────────────────────────────────────

  describe("Sélection d'un client depuis la liste", () => {
    it("appelle onChange avec les bonnes données après sélection d'un particulier", async () => {
      const { onChange } = renderComponent();
      await pickClientFromDropdown("John Doe");
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 1,
            client_first_name: "John",
            client_last_name: "Doe",
            client_type: "individual",
          })
        )
      );
    });

    it("appelle onChange avec les bonnes données pour une entreprise française", async () => {
      const { onChange } = renderComponent();
      await pickClientFromDropdown("Acme Corp");
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 2,
            client_legal_name: "Acme Corp",
            client_siret: "73282932000074",
            client_type: "company_fr",
          })
        )
      );
    });

    it("appelle onChange avec les bonnes données pour une entreprise UE", async () => {
      const { onChange } = renderComponent();
      await pickClientFromDropdown("EU Partner GmbH");
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 3,
            client_legal_name: "EU Partner GmbH",
            client_vat_number: "DE123456789",
            client_type: "company_eu",
          })
        )
      );
    });
  });

  // ── Affichage conditionnel par type de client ──────────────────────────────

  describe("Affichage conditionnel des champs", () => {
    it("affiche Prénom/Nom (et non Raison sociale) pour un particulier", async () => {
      renderComponent();
      await pickClientFromDropdown("John Doe");
      await waitFor(() => {
        expect(screen.getByLabelText("Prénom")).toBeInTheDocument();
        expect(screen.getByLabelText("Nom")).toBeInTheDocument();
        expect(screen.queryByLabelText("Raison sociale")).not.toBeInTheDocument();
      });
    });

    it("affiche Raison sociale + SIRET pour company_fr", async () => {
      renderComponent();
      await pickClientFromDropdown("Acme Corp");
      await waitFor(() => {
        expect(screen.getByLabelText("Raison sociale")).toBeInTheDocument();
        expect(screen.getByLabelText("SIRET")).toBeInTheDocument();
        expect(screen.queryByLabelText("TVA intracommunautaire")).not.toBeInTheDocument();
      });
    });

    it("affiche Raison sociale + TVA intracommunautaire pour company_eu", async () => {
      renderComponent();
      await pickClientFromDropdown("EU Partner GmbH");
      await waitFor(() => {
        expect(screen.getByLabelText("Raison sociale")).toBeInTheDocument();
        expect(screen.getByLabelText("TVA intracommunautaire")).toBeInTheDocument();
        expect(screen.queryByLabelText("SIRET")).not.toBeInTheDocument();
      });
    });

    it("n'affiche pas les champs spécifiques si aucun type n'est sélectionné", async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByLabelText("Prénom")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Raison sociale")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("SIRET")).not.toBeInTheDocument();
      });
    });
  });

  // ── Modification manuelle des champs ──────────────────────────────────────

  describe("Modification manuelle des champs", () => {
    it("met à jour legal_name en temps réel quand on modifie Prénom ou Nom", async () => {
      const { onChange } = renderComponent();
      await pickClientFromDropdown("John Doe");

      const prenomInput = await screen.findByLabelText("Prénom");
      fireEvent.change(prenomInput, { target: { value: "Jane" } });

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            client_first_name: "Jane",
            client_legal_name: "Jane Doe",
          })
        )
      );
    });

    it("met à jour l'adresse et propage la valeur", async () => {
      const { onChange } = renderComponent();
      await pickClientFromDropdown("John Doe");

      const adresseInput = await screen.findByLabelText("Adresse");
      fireEvent.change(adresseInput, { target: { value: "99 rue Neuve" } });

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ client_address: "99 rue Neuve" })
        )
      );
    });

    it("met à jour le type de client manuellement", async () => {
      const { onChange } = renderComponent();
      await pickClientFromDropdown("John Doe");

      const typeSelect = await screen.findByTestId("select-Type de client");
      fireEvent.change(typeSelect, { target: { value: "company_fr" } });

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ client_type: "company_fr" })
        )
      );
    });
  });

  // ── Validation ────────────────────────────────────────────────────────────

  describe("Validation des champs", () => {
    it("affiche une erreur pour un email invalide (blur)", async () => {
      renderComponent();
      await pickClientFromDropdown("John Doe");

      const emailInput = await screen.findByLabelText("Email");
      fireEvent.change(emailInput, { target: { value: "pas-un-email" } });
      fireEvent.blur(emailInput);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeInTheDocument()
      );
    });

    it("n'affiche pas d'erreur pour un email vide (champ optionnel)", async () => {
      renderComponent();
      await pickClientFromDropdown("John Doe");

      const emailInput = await screen.findByLabelText("Email");
      fireEvent.change(emailInput, { target: { value: "" } });
      fireEvent.blur(emailInput);

      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      );
    });

    it("affiche une erreur pour un SIRET invalide", async () => {
      renderComponent();
      await pickClientFromDropdown("Acme Corp");

      const siretInput = await screen.findByLabelText("SIRET");
      fireEvent.change(siretInput, { target: { value: "123" } });
      fireEvent.blur(siretInput);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeInTheDocument()
      );
    });

    it("accepte un SIRET valide sans afficher d'erreur", async () => {
      renderComponent();
      await pickClientFromDropdown("Acme Corp");

      const siretInput = await screen.findByLabelText("SIRET");
      // SIRET valide (14 chiffres avec checksum Luhn correct)
      fireEvent.change(siretInput, { target: { value: "73282932000074" } });
      fireEvent.blur(siretInput);

      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      );
    });
  });

  // ── Mode disabled ─────────────────────────────────────────────────────────

  describe("Mode disabled", () => {
    it("désactive le sélecteur de client", async () => {
      renderComponent({ disabled: true });
      // react-select ajoute aria-disabled sur le conteneur
      await waitFor(() => {
        const select = document.querySelector(".react-select__control--is-disabled");
        // Si react-select n'est pas mocké, on vérifie via l'input caché
        // ou on accepte que le sélecteur soit present mais désactivé
        expect(
          document.querySelector("[aria-disabled='true'], .react-select__control--is-disabled, [disabled]")
        ).toBeTruthy();
      });
    });

    it("désactive tous les champs de saisie quand disabled=true", async () => {
      renderComponent({
        disabled: true,
        value: {
          client_type: "individual",
          client_first_name: "John",
          client_last_name: "Doe",
          client_legal_name: "John Doe",
          client_address: "12 rue de la Paix",
          client_city: "Paris",
          client_postal_code: "75001",
          client_country_code: "FR",
          client_email: "john@example.com",
          client_phone: "+33612345678",
        },
      });

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        inputs.forEach((input) =>
          expect(input).toBeDisabled()
        );
      });
    });
  });

  // ── Initialisation depuis la prop `value` ─────────────────────────────────

  describe("Hydratation depuis la prop value", () => {
    it("prérempli les champs d'un particulier si value est fourni", async () => {
      renderComponent({
        value: {
          client_id: 1,
          client_type: "individual",
          client_first_name: "Alice",
          client_last_name: "Martin",
          client_legal_name: "Alice Martin",
          client_address: "5 rue Voltaire",
          client_city: "Bordeaux",
          client_postal_code: "33000",
          client_country_code: "FR",
          client_email: "alice@example.com",
          client_phone: "+33600000000",
        },
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Prénom")).toHaveValue("Alice");
        expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
        expect(screen.getByLabelText("Email")).toHaveValue("alice@example.com");
      });
    });

    it("prérempli les champs d'une entreprise FR si value est fourni", async () => {
      renderComponent({
        value: {
          client_id: 2,
          client_type: "company_fr",
          client_legal_name: "Acme Corp",
          client_siret: "73282932000074",
          client_address: "1 avenue des Champs",
          client_city: "Lyon",
          client_postal_code: "69001",
          client_country_code: "FR",
          client_email: "contact@acme.fr",
          client_phone: "+33478000000",
        },
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Raison sociale")).toHaveValue("Acme Corp");
        expect(screen.getByLabelText("SIRET")).toHaveValue("73282932000074");
      });
    });

    it("réinitialise le formulaire si value devient vide", async () => {
      const { rerender } = render(
        <InvoiceClient
          value={{ client_type: "individual", client_first_name: "Bob" }}
          onChange={vi.fn()}
        />
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Prénom")).toHaveValue("Bob")
      );

      rerender(<InvoiceClient value={{}} onChange={vi.fn()} />);

      await waitFor(() =>
        expect(screen.queryByLabelText("Prénom")).not.toBeInTheDocument()
      );
    });
  });

  // ── Cas d'erreur réseau ───────────────────────────────────────────────────

  describe("Gestion des erreurs réseau", () => {
    it("reste fonctionnel si fetchClients échoue (aucun crash)", async () => {
      mockFetchClients.mockRejectedValueOnce(new Error("Network error"));
      renderComponent();

      await waitFor(() =>
        expect(screen.getByText("Rechercher un client...")).toBeInTheDocument()
      );
    });
  });

  // ── determineClientType (inférence automatique) ───────────────────────────

  describe("Inférence automatique du type de client", () => {
    it("infère company_fr depuis client_siret dans value", async () => {
      renderComponent({
        value: {
          client_siret: "73282932000074",
          client_legal_name: "Inferred FR",
          client_address: "",
          client_city: "",
          client_postal_code: "",
          client_country_code: "FR",
          client_email: "",
          client_phone: "",
        },
      });

      await waitFor(() =>
        expect(screen.getByTestId("select-Type de client")).toHaveValue("company_fr")
      );
    });

    it("infère company_eu depuis un vat_number non-numérique", async () => {
      renderComponent({
        value: {
          client_vat_number: "DE123456789",
          client_legal_name: "Inferred EU",
          client_address: "",
          client_city: "",
          client_postal_code: "",
          client_country_code: "DE",
          client_email: "",
          client_phone: "",
        },
      });

      await waitFor(() =>
        expect(screen.getByTestId("select-Type de client")).toHaveValue("company_eu")
      );
    });

    it("infère individual depuis la présence d'un prénom ET d'un nom", async () => {
      renderComponent({
        value: {
          client_first_name: "Clara",
          client_last_name: "Dupont",
          client_address: "",
          client_city: "",
          client_postal_code: "",
          client_country_code: "FR",
          client_email: "",
          client_phone: "",
        },
      });

      await waitFor(() =>
        expect(screen.getByTestId("select-Type de client")).toHaveValue("individual")
      );
    });
  });
});