// src/modules/invoices/__tests__/invoices.route.test.js

// --- Fix CI : définir les clés avant tout import ---
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '01234567890123456789012345678901';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';

const request = require("supertest");
const express = require("express");

// --- Mock Resend pour éviter les appels réels ---
jest.mock("resend", () => ({
  Resend: jest.fn(() => ({
    emails: { send: jest.fn() },
  })),
}));

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

// === Mock des constantes ===
jest.mock("../../../../constants/paymentMethods", () => ({ paymentMethodsOptions: [] }));
jest.mock("../../../../constants/paymentTerms", () => ({ paymentTermsOptions: [] }));

// === Mock du controller ===
jest.mock("../invoices.controller", () => ({
  getInvoices: (req, res) => res.status(200).json([{ id: 1, clientId: 1, total: 100 }]),
  createInvoice: (req, res) => {
    const { clientId, total } = req.body;
    res.status(201).json({ id: 2, clientId, total });
  },
  sendInvoice: jest.fn((req, res) => res.status(200).end()),
  createInvoicePdf: jest.fn((req, res) => res.status(200).end()),
  getInvoice: jest.fn((req, res) => res.status(200).end()),
  getInvoiceStatus: jest.fn((req, res) => res.status(200).end()),
  refreshInvoiceStatus: jest.fn((req, res) => res.status(200).end()),
  markInvoicePaid: jest.fn((req, res) => res.status(200).end()),
  getInvoiceLifecycle: jest.fn((req, res) => res.status(200).end()),
  getInvoiceStatusComment: jest.fn((req, res) => res.status(200).end()),
  generateInvoicePdfBuffer: jest.fn((req, res) => res.status(200).end()),
  updateInvoice: jest.fn((req, res) => res.status(200).end()),
  deleteInvoice: jest.fn((req, res) => res.status(200).end()),
  getInvoicePdfA3Url: jest.fn((req, res) => res.status(200).json({ url: "http://example.com/fake.pdf" })),
  getInvoicePdfA3Proxy: jest.fn((req, res) => res.status(200).send(Buffer.from("mock-pdf"))),
  getDepositInvoices: jest.fn((req, res) => res.status(200).json([])),
}));

// === Mock S3 pour PDF proxy ===
jest.mock("../../../../config/s3Client", () => ({
  s3Client: { send: jest.fn().mockResolvedValue({ Body: { pipe: jest.fn() } }) },
}));

// --- Setup Express ---
const app = express();
app.use(express.json());

// --- Mock logger pour éviter les 500 ---
app.use((req, res, next) => {
  req.log = { info: jest.fn(), error: jest.fn() };
  next();
});

app.use("/api/invoices", invoicesRouter);

// --- Tests ---
describe("Invoices routes (mockées pour CI)", () => {
  // ----------------------------
  // CRUD Factures
  // ----------------------------
  it("GET /api/invoices retourne un tableau de factures", async () => {
    const res = await request(app).get("/api/invoices");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("id");
  });

  it("GET /api/invoices/:id appelle getInvoice", async () => {
    const res = await request(app).get("/api/invoices/1");
    expect(res.status).toBe(200);
  });

  it("POST /api/invoices crée une facture", async () => {
    const res = await request(app)
      .post("/api/invoices")
      .send({ clientId: 1, total: 100 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.total).toBe(100);
  });

  it("PUT /api/invoices/:id met à jour une facture", async () => {
    const res = await request(app)
      .put("/api/invoices/1")
      .send({ total: 200 });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/invoices/:id supprime une facture", async () => {
    const res = await request(app).delete("/api/invoices/1");
    expect(res.status).toBe(200);
  });

  // ----------------------------
  // PDF
  // ----------------------------
  it("GET /api/invoices/:id/pdf-a3-url retourne l'URL PDF", async () => {
    const res = await request(app).get("/api/invoices/1/pdf-a3-url");
    expect(res.status).toBe(200);
    expect(res.body.url).toBe("http://example.com/fake.pdf");
  });

  it("GET /api/invoices/:id/pdf-a3-proxy retourne le PDF", async () => {
    const res = await request(app)
      .get("/api/invoices/1/pdf-a3-proxy")
      .buffer();
    expect(res.status).toBe(200);
    expect(res.body.toString()).toBe("mock-pdf");
  });

  it("POST /api/invoices/generate-pdf génère un buffer PDF", async () => {
    const res = await request(app).post("/api/invoices/generate-pdf");
    expect(res.status).toBe(200);
  });

  // ----------------------------
  // Email
  // ----------------------------
  it("POST /api/invoices/:id/send envoie une facture", async () => {
    const res = await request(app).post("/api/invoices/1/send");
    expect(res.status).toBe(200);
  });

  // ----------------------------
  // Statut / cycle métier
  // ----------------------------
  it("GET /api/invoices/:id/status récupère le statut technique", async () => {
    const res = await request(app).get("/api/invoices/1/status");
    expect(res.status).toBe(200);
  });

  it("POST /api/invoices/:id/refresh-status rafraîchit le statut métier", async () => {
    const res = await request(app).post("/api/invoices/1/refresh-status");
    expect(res.status).toBe(200);
  });

  it("POST /api/invoices/:id/paid marque la facture comme encaissée", async () => {
    const res = await request(app).post("/api/invoices/1/paid");
    expect(res.status).toBe(200);
  });

  it("GET /api/invoices/:id/lifecycle récupère le cycle métier", async () => {
    const res = await request(app).get("/api/invoices/1/lifecycle");
    expect(res.status).toBe(200);
  });

  it("GET /api/invoices/:id/status/:statusCode/comment récupère le commentaire statut", async () => {
    const res = await request(app).get("/api/invoices/1/status/42/comment");
    expect(res.status).toBe(200);
  });

  // ----------------------------
  // Deposits
  // ----------------------------
  it("GET /api/invoices/deposits récupère les factures de dépôt", async () => {
    const res = await request(app).get("/api/invoices/deposits");
    expect(res.status).toBe(200);
  });
});