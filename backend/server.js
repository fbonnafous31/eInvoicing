require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./src/middlewares/errorHandler");
const { register, metricsMiddleware } = require("./src/monitoring/metrics");

// Routes métier
const sellersRoutes = require("./src/modules/sellers/sellers.route");
const clientsRoutes = require("./src/modules/clients/clients.route");
const invoicesRoutes = require("./src/modules/invoices/invoices.route");

const app = express();

// 🌍 CORS dynamique selon l'origin
const allowedOrigins = [
  "http://localhost:5173", // front local
  "https://einvoicing-preprod-frontend.onrender.com" // front préprod
];

app.use(cors({
  origin: function(origin, callback) {
    // autorise les requêtes sans origin (ex: curl, Postman)
    if (!origin) return callback(null, true);
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
  console.log("Header Authorization :", req.headers.authorization || "none");
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

// Middleware global d'erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});
