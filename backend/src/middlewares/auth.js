// backend/src/middlewares/auth.js
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

// Middleware principal pour vérifier le JWT
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
  requestProperty: 'user',
});

// Wrapper pour ajouter des logs détaillés
function withLogging(req, res, next) {

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn("⚠️ Aucun header Authorization trouvé !");
  } else {
    const rawToken = authHeader.split(" ")[1];
    if (rawToken) {
      try {
        JSON.parse(Buffer.from(rawToken.split(".")[1], "base64").toString("utf8"));
      } catch (err) {
        console.error("❌ Impossible de décoder le token :", err.message);
      }
    }
  }

  // Appel du middleware express-jwt
  return checkJwt(req, res, (err) => {
    if (err) {
      console.error("❌ checkJwt a échoué :", err.name, "-", err.message);
      // On peut renvoyer le statut 401/403 personnalisé pour tester
      return res.status(err.status || 401).json({ error: err.message });
    }
    next();
  });
}

module.exports = withLogging;
