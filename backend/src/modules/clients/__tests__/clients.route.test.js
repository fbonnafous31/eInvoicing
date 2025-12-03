const request = require("supertest");
const express = require("express");

// === Import du vrai router ===
const clientsRouter = require("../clients.route");

// === Mock des middlewares ===
jest.mock("../../../middlewares/auth", () => (req, res, next) => next());
jest.mock("../../../middlewares/attachSeller", () => (req, res, next) => {
  req.seller = { id: 1 };
  next();
});
jest.mock("../../../middlewares/requestLogger", () => (req, res, next) => {
  req.log = { info: jest.fn(), error: jest.fn() }; // correspond à ton utilisation dans les routes
  next();
});

// === Mock du contrôleur ===
jest.mock("../clients.controller", () => ({
  getClients: jest.fn((req, res) => {
    res.status(200).json([
      { id: 1, name: "Client A", siret: "12345678900011" },
      { id: 2, name: "Client B", siret: "98765432100022" },
    ]);
  }),
  createClient: jest.fn((req, res) => {
    const { name, siret } = req.body;
    res.status(201).json({ id: 3, name, siret });
  }),
  getClientById: jest.fn((req, res) => {
    const { id } = req.params;
    res.status(200).json({ id: parseInt(id), name: "Client X", siret: "11223344556677" });
  }),
  deleteClient: jest.fn((req, res) => {
    res.status(204).send();
  }),
  updateClient: jest.fn((req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    res.status(200).json({ id: parseInt(id), name });
  }),
  checkSiret: jest.fn((req, res) => {
    const { siret } = req.params;
    const valid = /^[0-9]{14}$/.test(siret);
    if (valid) {
      res.status(200).json({ valid: true, companyName: "Entreprise Test" });
    } else {
      res.status(400).json({ valid: false, message: "SIRET invalide" });
    }
  }),
}));

// === Setup express ===
const app = express();
app.use(express.json()); // <- important pour parser le body en POST/PUT

// Mock du logger attendu par les routes
app.use((req, res, next) => {
  req.logger = { info: jest.fn(), error: jest.fn() };
  next();
});

app.use("/api/clients", clientsRouter);


// === Tests ===
describe("Clients routes (réelles)", () => {

  it("GET /api/clients retourne la liste des clients", async () => {
    const res = await request(app).get("/api/clients");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("name");
  });

  it("POST /api/clients crée un nouveau client", async () => {
    const res = await request(app)
      .post("/api/clients")
      .send({ name: "Client Nouveau", siret: "12345678901234" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Client Nouveau");
  });

  it("GET /api/clients/:id retourne un client par ID", async () => {
    const res = await request(app).get("/api/clients/5");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 5);
  });

  it("PUT /api/clients/:id met à jour un client", async () => {
    const res = await request(app)
      .put("/api/clients/2")
      .send({ name: "Client Modifié" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Client Modifié");
  });

  it("DELETE /api/clients/:id supprime un client", async () => {
    const res = await request(app).delete("/api/clients/2");
    expect(res.status).toBe(204);
  });

  it("GET /api/clients/check-siret/:siret vérifie un SIRET valide", async () => {
    const res = await request(app).get("/api/clients/check-siret/12345678901234");
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("GET /api/clients/check-siret/:siret retourne une erreur pour un SIRET invalide", async () => {
    const res = await request(app).get("/api/clients/check-siret/abc123");
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });
});
