const request = require("supertest");
const express = require("express");

// === Import du vrai router ===
const sellersRouter = require("../sellers.route");

// === Mock des middlewares ===
jest.mock("../../../middlewares/auth", () => (req, res, next) => next());
jest.mock("../../../middlewares/attachSeller", () => (req, res, next) => {
  req.seller = { id: 1 }; // simulateur vendeur connecté
  next();
});

// === Mock du contrôleur ===
jest.mock("../sellers.controller", () => ({
  checkIdentifier: jest.fn((req, res) => {
    const { identifier } = req.query;
    const valid = identifier && identifier.length > 3;
    if (valid) {
      res.status(200).json({ valid: true, message: "Identifiant valide" });
    } else {
      res.status(400).json({ valid: false, message: "Identifiant invalide" });
    }
  }),
  getMySeller: jest.fn((req, res) => {
    res.status(200).json({ id: req.seller.id, name: "Vendeur Test" });
  }),
  createSeller: jest.fn((req, res) => {
    const { name } = req.body;
    res.status(201).json({ id: 2, name });
  }),
  updateSeller: jest.fn((req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    res.status(200).json({ id: parseInt(id), name });
  }),
  testSmtpResend: jest.fn((req, res) => {
    res.status(200).json({ success: true });
  }),
}));

// === Setup express ===
const app = express();
app.use(express.json()); // obligatoire pour POST/PUT
app.use((req, res, next) => {
  req.log = { info: jest.fn(), error: jest.fn() };
  next();
});
app.use("/api/sellers", sellersRouter);

// === Tests ===
describe("Sellers routes", () => {
  it("GET /api/sellers/check-identifier valide", async () => {
    const res = await request(app).get("/api/sellers/check-identifier?identifier=test123");
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("GET /api/sellers/check-identifier invalide", async () => {
    const res = await request(app).get("/api/sellers/check-identifier?identifier=a");
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it("GET /api/sellers/me retourne le vendeur connecté", async () => {
    const res = await request(app).get("/api/sellers/me");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
  });

  it("POST /api/sellers crée un vendeur", async () => {
    const res = await request(app).post("/api/sellers").send({ name: "Nouveau Vendeur" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Nouveau Vendeur");
  });

  it("PUT /api/sellers/:id met à jour un vendeur", async () => {
    const res = await request(app).put("/api/sellers/2").send({ name: "Vendeur Modifié" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Vendeur Modifié");
  });

  it("POST /api/sellers/smtp/test-resend teste l'envoi SMTP", async () => {
    const res = await request(app).post("/api/sellers/smtp/test-resend").send({ email: "test@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
