import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthProvider from "./AuthProvider.jsx";

vi.mock("react-pdf", () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>PDF Page Mock</div>,
  pdfjs: { GlobalWorkerOptions: {} },
}));

describe("main rendering", () => {
  it("rend App sans planter et affiche Chargement...", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });
});