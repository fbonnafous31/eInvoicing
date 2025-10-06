const request = require("supertest");
const express = require("express");

// === Import du vrai router ===
const sellersRouter = require("../sellers.route");

// === Mock des middlewares ===
jest.mock("../../../middlewares/auth", () => (req, res, next) => next());
jest.mock("../../../middlewares/attachSeller", () => (req, res, next) => {
  req.seller = { id: 1, name: "Mon Vendeur" };
  next();
});

// === Mock du contrôleur ===
jest.mock("../sellers.controller", () => ({
  checkIdentifier: jest.fn((req, res) => {
    const { identifier } = req.query;
    if (identifier === "VALID123") {
      return res.status(200).json({ exists: false, message: "Identifiant disponible" });
    }
    return res.status(200).json({ exists: true, message: "Identifiant déjà utilisé" });
  }),

  getMySeller: jest.fn((req, res) => {
    res.status(200).json({ id: req.seller.id, name: "Mon Vendeur", email: "test@seller.com" });
  }),

  createSeller: jest.fn((req, res) => {
    const { name, email } = req.body;
    res.status(201).json({ id: 2, name, email });
  }),

  updateSeller: jest.fn((req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    res.status(200).json({ id: parseInt(id), name });
  }),
}));

// === Setup express ===
const app = express();
app.use(express.json());
app.use("/api/sellers", sellersRouter);

// === Tests ===
describe("Sellers routes (réelles)", () => {
  it("GET /api/sellers/check-identifier renvoie un message selon l'identifiant", async () => {
    const resValid = await request(app).get("/api/sellers/check-identifier?identifier=VALID123");
    expect(resValid.status).toBe(200);
    expect(resValid.body.exists).toBe(false);

    const resInvalid = await request(app).get("/api/sellers/check-identifier?identifier=USED123");
    expect(resInvalid.status).toBe(200);
    expect(resInvalid.body.exists).toBe(true);
  });

  it("GET /api/sellers/me retourne les informations du vendeur connecté", async () => {
    const res = await request(app).get("/api/sellers/me");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Mon Vendeur");
  });

  it("POST /api/sellers crée un vendeur", async () => {
    const res = await request(app)
      .post("/api/sellers")
      .send({ name: "Nouveau Vendeur", email: "new@seller.com" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Nouveau Vendeur");
  });

  it("PUT /api/sellers/:id met à jour un vendeur", async () => {
    const res = await request(app)
      .put("/api/sellers/2")
      .send({ name: "Vendeur Modifié" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Vendeur Modifié");
  });
});
