import { render, screen, fireEvent } from "@testing-library/react";
import FormSection from "./FormSection";

describe("FormSection", () => {
  const toggleSectionMock = vi.fn();
  const sectionKey = "sec1";

  it("affiche le titre et l'icône ▼ si fermé", () => {
    render(
      <FormSection
        title="Ma section"
        sectionKey={sectionKey}
        openSections={{ [sectionKey]: false }}
        toggleSection={toggleSectionMock}
        hasError={false}
      >
        <p>Contenu</p>
      </FormSection>
    );

    expect(screen.getByRole("button")).toHaveTextContent("Ma section ▼");
    expect(screen.queryByText("Contenu")).not.toBeInTheDocument();
  });

  it("affiche le contenu si ouvert", () => {
    render(
      <FormSection
        title="Ma section"
        sectionKey={sectionKey}
        openSections={{ [sectionKey]: true }}
        toggleSection={toggleSectionMock}
        hasError={false}
      >
        <p>Contenu</p>
      </FormSection>
    );

    expect(screen.getByText("Contenu")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Ma section ▲");
  });

  it("appelle toggleSection au clic", () => {
    render(
      <FormSection
        title="Ma section"
        sectionKey={sectionKey}
        openSections={{ [sectionKey]: false }}
        toggleSection={toggleSectionMock}
        hasError={false}
      >
        <p>Contenu</p>
      </FormSection>
    );

    fireEvent.click(screen.getByRole("button"));
    expect(toggleSectionMock).toHaveBeenCalledWith(sectionKey);
  });

  it("affiche l’icône d’erreur si hasError=true", () => {
    render(
      <FormSection
        title="Ma section"
        sectionKey={sectionKey}
        openSections={{ [sectionKey]: false }}
        toggleSection={toggleSectionMock}
        hasError={true}
      >
        <p>Contenu</p>
      </FormSection>
    );

    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });
});
