const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const requestId = uuidv4();
  req.id = requestId;

  // Child logger attaché à la requête
  req.logger = logger.child({ requestId });

  // Alias req.log pour compatibilité avec tes contrôleurs existants
  req.log = req.logger;

  // Début du timing
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);

    req.logger.info({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${durationMs}ms`,
      user: req.user ? { id: req.user.id } : undefined
    }, "HTTP request completed");
  });

  next();
}

module.exports = requestLogger;
