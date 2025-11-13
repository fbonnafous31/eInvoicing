require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./src/middlewares/errorHandler");
const { register, metricsMiddleware } = require("./src/monitoring/metrics");

// Services
const storageService = require("./src/services"); // ton service de stockage B2

// Routes métier
const sellersRoutes = require("./src/modules/sellers/sellers.route");
const clientsRoutes = require("./src/modules/clients/clients.route");
const invoicesRoutes = require("./src/modules/invoices/invoices.route");

const app = express();

// 🌟 Pour détecter correctement HTTPS derrière Render
app.enable('trust proxy');

// 🌍 CORS dynamique selon l'origin
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://einvoicing-preprod-frontend.onrender.com",
  "http://e-invoicing.local"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // autorise les requêtes sans origin (Postman, curl)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));

// Log simple des requêtes
app.use((req, res, next) => {
  if (req.originalUrl === '/favicon.ico') return next();
  console.log("⚡ Requête reçue :", req.method, req.originalUrl);
  next();
});

// Middlewares JSON / URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prometheus avant les routes
app.use(metricsMiddleware);

// Routes API
app.use("/api/sellers", sellersRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/invoices", invoicesRoutes);

// Route /health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Endpoint Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// 📂 Rendre accessible le répertoire uploads
app.use("/uploads", express.static(path.join(__dirname, "src/uploads")));
app.use("/pdf-a3", express.static(path.join(__dirname, "src/uploads/pdf-a3")));

// ----------------------
// Proxy sécurisé pour PDF/A-3 depuis B2
// ----------------------
app.get("/api/invoices/:id/pdf-a3-proxy", async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = `pdf-a3/${id}_pdf-a3.pdf`;

    // Récupère le fichier depuis B2 (ou local si tu veux tester en dev)
    const fileBuffer = await storageService.get(filePath);

    if (!fileBuffer) {
      return res.status(404).json({ message: "PDF/A-3 non trouvé" });
    }

    // En-têtes pour le navigateur
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="facture_${id}_PDF-A3.pdf"`);

    res.send(fileBuffer);
  } catch (err) {
    console.error("[PDF Proxy]", err);
    res.status(500).json({ message: "Erreur téléchargement PDF/A-3" });
  }
});

// Middleware global d'erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});
