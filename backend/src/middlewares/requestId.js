const { randomUUID } = require("crypto");

function requestIdMiddleware(req, res, next) {
  const id = randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = requestIdMiddleware;
