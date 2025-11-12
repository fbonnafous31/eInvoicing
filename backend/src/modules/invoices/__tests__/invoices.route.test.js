// src/modules/invoices/__tests__/invoices.route.test.js

// --- Fix CI : définir les clés avant tout import ---
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '01234567890123456789012345678901';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';

const request = require("supertest");
const express = require("express");

// --- Mock Resend pour éviter les appels réels ---
jest.mock("resend", () => {
  return {
    Resend: jest.fn(() => ({
      emails: { send: jest.fn() },
    })),
  };
});

// --- Import du vrai router APRÈS les mocks / variables d'env ---
const invoicesRouter = require("../invoices.route");

// === Mock des middlewares ===
jest.mock("../../../middlewares/auth", () => (req, res, next) => next());
jest.mock("../../../middlewares/attachSeller", () => (req, res, next) => {
  req.seller = { id: 1 };
  next();
});

// === Mock des utilitaires ESM qui cassent Jest ===
jest.mock("../../../utils/facturx/facturx-generator", () => ({
  generateFacturXXML: jest.fn(() => "mock-xml"),
}));
jest.mock("../../../utils/invoice-pdf/pdf-generator", () => ({
  embedFacturXInPdf: jest.fn(() => Buffer.from("mock-pdf")),
}));

// === Mock des constantes pour éviter les imports ESM ===
jest.mock("../../../../constants/paymentMethods", () => ({
  paymentMethodsOptions: [],
}));
jest.mock("../../../../constants/paymentTerms", () => ({
  paymentTermsOptions: [],
}));

// === Mock du controller ===
jest.mock("../invoices.controller", () => ({
  getInvoices: (req, res) => res.status(200).json([{ id: 1, clientId: 1, total: 100 }]),
  createInvoice: (req, res) => {
    const { clientId, total } = req.body;
    res.status(201).json({ id: 2, clientId, total });
  },
  sendInvoice: jest.fn(),
  createInvoicePdf: jest.fn(),
  getInvoice: jest.fn(),
  getInvoiceStatus: jest.fn(),
  refreshInvoiceStatus: jest.fn(),
  markInvoicePaid: jest.fn(),
  getInvoiceLifecycle: jest.fn(),
  getInvoiceStatusComment: jest.fn(),
  generateInvoicePdfBuffer: jest.fn(),
  updateInvoice: jest.fn(),
  deleteInvoice: jest.fn(),
  getInvoicePdfA3Url: jest.fn((req, res) => res.status(200).json({ url: "http://example.com/fake.pdf" })),
  getInvoicePdfA3Proxy: jest.fn((req, res) => res.status(200).send(Buffer.from("mock-pdf"))),
}));

// --- Setup Express ---
const app = express();
app.use(express.json());
app.use("/api/invoices", invoicesRouter);

// --- Tests ---
describe("Invoices routes (réelles, mockées pour CI)", () => {
  it("GET /api/invoices retourne un tableau de factures", async () => {
    const res = await request(app).get("/api/invoices");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("id");
  });

  it("POST /api/invoices crée une facture", async () => {
    const res = await request(app)
      .post("/api/invoices")
      .send({ clientId: 1, total: 100 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.total).toBe(100);
  });
});
