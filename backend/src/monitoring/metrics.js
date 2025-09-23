// src/monitoring/metrics.js
const client = require("prom-client");

// Créer un registre dédié
const register = new client.Registry();

// Collecte des métriques par défaut
client.collectDefaultMetrics({ register, timeout: 5000 });

// Histogramme pour suivre la durée des requêtes
const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2.5, 5],
});

// Enregistrer l’histogramme
register.registerMetric(httpRequestDurationSeconds);

// Middleware de mesure des requêtes
function metricsMiddleware(req, res, next) {
  const end = httpRequestDurationSeconds.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
}

module.exports = {
  register,
  metricsMiddleware,
};
