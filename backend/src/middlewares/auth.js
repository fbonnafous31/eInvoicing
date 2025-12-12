// backend/src/middlewares/auth.js
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const logger = require("../utils/logger");

// Middleware express-jwt principal
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
  requestProperty: "user",
});

// Vérification défensive du header JWT (fast-fail)
function strictAlgCheck(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn("⚠️ Authorization header missing");
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    logger.warn("⚠️ Authorization header malformed");
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  const rawToken = parts[1];
  const segments = rawToken.split(".");
  if (segments.length < 2) {
    logger.warn("⚠️ Token malformed (not enough segments)");
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  try {
    const headerJson = Buffer.from(segments[0], "base64").toString("utf8");
    const header = JSON.parse(headerJson);
    if (header.alg !== "RS256") {
      logger.warn("❌ Token with unexpected alg detected", { alg: header.alg, kid: header.kid });
      return res.status(401).json({ error: "Invalid or missing token" });
    }
  } catch (err) {
    logger.warn("❌ Cannot parse token header", { err: err.message });
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  next();
}

// Middleware final avec logs
function withLogging(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn("⚠️ Aucun header Authorization trouvé !");
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  // Vérif alg fast-fail
  strictAlgCheck(req, res, () => {
    // express-jwt principal
    return checkJwt(req, res, (err) => {
      if (err) {
        logger.error("❌ checkJwt failed", {
          name: err.name,
          message: err.message,
          status: err.status,
          path: req.path,
          method: req.method,
        });
        return res.status(err.status || 401).json({ error: "Invalid or missing token" });
      }

      // Log succès visible
      logger.info("✅ JWT valid", { sub: req.user.sub, path: req.path, method: req.method });
      next();
    });
  });
}

module.exports = withLogging;
