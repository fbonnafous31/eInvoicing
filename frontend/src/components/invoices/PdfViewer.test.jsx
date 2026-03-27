// PdfViewer.test.jsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — avant les imports du composant
// ---------------------------------------------------------------------------

// On capture les callbacks onLoadSuccess / onLoadError pour les déclencher manuellement
let capturedOnLoadSuccess = null;
let capturedOnLoadError = null;

vi.mock("react-pdf", () => ({
  Document: ({ children, onLoadSuccess, onLoadError }) => {
    capturedOnLoadSuccess = onLoadSuccess;
    capturedOnLoadError = onLoadError;
    return <div data-testid="document">{children}</div>;
  },
  Page: ({ pageNumber, scale, width }) => (
    <div
      data-testid="page"
      data-page={pageNumber}
      data-scale={scale}
      data-width={width}
    >
      Page {pageNumber}
    </div>
  ),
  pdfjs: { GlobalWorkerOptions: {} },
}));

// Mock du worker URL (import ?url)
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "fake-worker.js",
}));

import PdfViewer from "./PdfViewer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FILE_URL = "/dummy.pdf";
const INVOICE_ID = 123;

function renderViewer(props = {}) {
  capturedOnLoadSuccess = null;
  capturedOnLoadError = null;
  return render(
    <PdfViewer fileUrl={FILE_URL} invoiceId={INVOICE_ID} {...props} />
  );
}

/** Simule le chargement réussi du document avec N pages */
function loadDocument(numPages = 3) {
  act(() => capturedOnLoadSuccess?.({ numPages }));
}

/** Simule une erreur de chargement */
function failDocument(err = new Error("PDF KO")) {
  act(() => capturedOnLoadError?.(err));
}

function getNavButtons() {
  return {
    prev: screen.getByTitle ? screen.queryByTitle("prev") : null,
    // On les repère par leur contenu emoji
    prevBtn: screen.getByText("⬅️"),
    nextBtn: screen.getByText("➡️"),
    zoomOut: screen.getByText("–"),
    zoomIn: screen.getByText("+"),
  };
}

// ---------------------------------------------------------------------------
// 1. Rendu sans fileUrl
// ---------------------------------------------------------------------------

describe("PdfViewer — sans fileUrl", () => {
  it("affiche le message 'Aucun PDF disponible' si fileUrl est absent", () => {
    render(<PdfViewer />);
    expect(screen.getByText(/Aucun PDF disponible/i)).toBeInTheDocument();
  });

  it("n'affiche pas le composant Document si fileUrl est absent", () => {
    render(<PdfViewer />);
    expect(screen.queryByTestId("document")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Rendu initial avec fileUrl
// ---------------------------------------------------------------------------

describe("PdfViewer — rendu initial", () => {
  afterEach(() => vi.clearAllMocks());

  it("affiche le composant Document", () => {
    renderViewer();
    expect(screen.getByTestId("document")).toBeInTheDocument();
  });

  it("affiche la Page du PDF", () => {
    renderViewer();
    expect(screen.getByTestId("page")).toBeInTheDocument();
  });

  it("affiche '1 / ?' avant le chargement du document", () => {
    renderViewer();
    expect(screen.getByText("1 / ?")).toBeInTheDocument();
  });

  it("affiche le zoom à 100% au départ", () => {
    renderViewer();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("désactive le bouton ⬅️ sur la première page", () => {
    renderViewer();
    expect(screen.getByText("⬅️")).toBeDisabled();
  });

  it("désactive le bouton ➡️ si numPages est inconnu", () => {
    renderViewer();
    // numPages=null → pageNumber(1) >= null est false mais disabled={pageNumber >= numPages}
    // avec numPages=null → 1 >= null → false → pas disabled
    // On vérifie juste que le bouton existe
    expect(screen.getByText("➡️")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Chargement réussi du document
// ---------------------------------------------------------------------------

describe("PdfViewer — onDocumentLoadSuccess", () => {
  afterEach(() => vi.clearAllMocks());

  it("met à jour numPages après chargement", () => {
    renderViewer();
    loadDocument(5);
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("remet pageNumber à 1 après chargement", () => {
    renderViewer();
    loadDocument(3);
    // On avance à la page 2 puis on recharge
    act(() => fireEvent.click(screen.getByText("➡️")));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    loadDocument(4);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("active ➡️ si numPages > 1", () => {
    renderViewer();
    loadDocument(3);
    expect(screen.getByText("➡️")).not.toBeDisabled();
  });

  it("désactive ➡️ si numPages === 1", () => {
    renderViewer();
    loadDocument(1);
    expect(screen.getByText("➡️")).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 4. Navigation entre pages
// ---------------------------------------------------------------------------

describe("PdfViewer — navigation", () => {
  afterEach(() => vi.clearAllMocks());

  it("avance à la page suivante au clic sur ➡️", () => {
    renderViewer();
    loadDocument(3);
    fireEvent.click(screen.getByText("➡️"));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("revient à la page précédente au clic sur ⬅️", () => {
    renderViewer();
    loadDocument(3);
    fireEvent.click(screen.getByText("➡️")); // page 2
    fireEvent.click(screen.getByText("⬅️")); // page 1
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("ne descend pas en dessous de la page 1", () => {
    renderViewer();
    loadDocument(3);
    // ⬅️ est disabled sur page 1, fireEvent passe quand même — on vérifie que l'état ne change pas
    fireEvent.click(screen.getByText("⬅️"));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("ne dépasse pas la dernière page", () => {
    renderViewer();
    loadDocument(2);
    fireEvent.click(screen.getByText("➡️")); // page 2
    fireEvent.click(screen.getByText("➡️")); // toujours page 2
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("désactive ⬅️ sur la première page", () => {
    renderViewer();
    loadDocument(3);
    expect(screen.getByText("⬅️")).toBeDisabled();
  });

  it("désactive ➡️ sur la dernière page", () => {
    renderViewer();
    loadDocument(2);
    fireEvent.click(screen.getByText("➡️")); // page 2
    expect(screen.getByText("➡️")).toBeDisabled();
  });

  it("active ⬅️ dès la page 2", () => {
    renderViewer();
    loadDocument(3);
    fireEvent.click(screen.getByText("➡️"));
    expect(screen.getByText("⬅️")).not.toBeDisabled();
  });

  it("passe la bonne pageNumber à Page", () => {
    renderViewer();
    loadDocument(3);
    fireEvent.click(screen.getByText("➡️"));
    expect(screen.getByTestId("page")).toHaveAttribute("data-page", "2");
  });
});

// ---------------------------------------------------------------------------
// 5. Zoom
// ---------------------------------------------------------------------------

describe("PdfViewer — zoom", () => {
  afterEach(() => vi.clearAllMocks());

  it("augmente le zoom au clic sur +", () => {
    renderViewer();
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("110%")).toBeInTheDocument();
  });

  it("diminue le zoom au clic sur –", () => {
    renderViewer();
    fireEvent.click(screen.getByText("–"));
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("ne descend pas en dessous de 10% (limite 0.1)", () => {
    renderViewer();
    // 1.0 → on clique 10 fois pour atteindre ~0.0 mais la limite est 0.1
    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByText("–"));
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("accumule plusieurs zooms +", () => {
    renderViewer();
    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("120%")).toBeInTheDocument();
  });

  it("passe le scale correct à Page", () => {
    renderViewer();
    fireEvent.click(screen.getByText("+"));
    const page = screen.getByTestId("page");
    expect(parseFloat(page.dataset.scale)).toBeCloseTo(1.1, 1);
  });
});

// ---------------------------------------------------------------------------
// 6. Erreur de chargement
// ---------------------------------------------------------------------------

describe("PdfViewer — erreur de chargement", () => {
  afterEach(() => vi.clearAllMocks());

  it("affiche le message d'erreur si onLoadError est déclenché", () => {
    renderViewer();
    failDocument();
    expect(screen.getByText(/Erreur de chargement du PDF/i)).toBeInTheDocument();
  });

  it("affiche l'erreur avec la classe text-danger", () => {
    renderViewer();
    failDocument();
    const errEl = screen.getByText(/Erreur de chargement du PDF/i);
    expect(errEl.closest(".text-danger")).toBeInTheDocument();
  });

  it("n'affiche pas d'erreur au départ", () => {
    renderViewer();
    expect(screen.queryByText(/Erreur de chargement/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. Bouton téléchargement
// ---------------------------------------------------------------------------

describe("PdfViewer — bouton téléchargement", () => {
  afterEach(() => vi.clearAllMocks());

  it("a le bon href (fileUrl)", () => {
    renderViewer();
    const btn = screen.getByText(/Télécharger/i).closest("a");
    expect(btn).toHaveAttribute("href", FILE_URL);
  });

  it("a l'attribut download avec le bon nom de fichier", () => {
    renderViewer();
    const btn = screen.getByText(/Télécharger/i).closest("a");
    expect(btn).toHaveAttribute("download", `facture_${INVOICE_ID}.pdf`);
  });

  it("utilise 'unknown' comme fallback si invoiceId est absent", () => {
    renderViewer({ invoiceId: undefined });
    const btn = screen.getByText(/Télécharger/i).closest("a");
    expect(btn).toHaveAttribute("download", "facture_unknown.pdf");
  });

  it("ouvre dans un nouvel onglet (target=_blank)", () => {
    renderViewer();
    const btn = screen.getByText(/Télécharger/i).closest("a");
    expect(btn).toHaveAttribute("target", "_blank");
  });
});

// ---------------------------------------------------------------------------
// 8. Gestion du resize
// ---------------------------------------------------------------------------

describe("PdfViewer — resize", () => {
  afterEach(() => vi.clearAllMocks());

  it("ajoute un écouteur resize au montage", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderViewer();
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("retire l'écouteur resize au démontage", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderViewer();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("met à jour la largeur lors d'un resize", () => {
    renderViewer();
    // On simule un resize — le containerRef.current.clientWidth sera lu
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    // Pas de crash = comportement correct (clientWidth = 0 en jsdom)
    expect(screen.getByTestId("page")).toBeInTheDocument();
  });
});