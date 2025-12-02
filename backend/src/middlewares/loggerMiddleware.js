const logger = require("../utils/logger");

function loggerMiddleware(req, res, next) {
  req.log = logger;
  next();
}

module.exports = loggerMiddleware;
