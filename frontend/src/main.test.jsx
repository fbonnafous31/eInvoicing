// main.test.jsx
import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthProvider from "./AuthProvider.jsx";

// Mock PDF pour éviter DOMMatrix
vi.mock("react-pdf", () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>PDF Page Mock</div>,
  pdfjs: { GlobalWorkerOptions: {} },
}));

describe("App rendering", () => {
  it("rend App avec BrowserRouter et AuthProvider sans erreur", () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(container).toBeDefined();
  });
});
