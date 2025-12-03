const logger = require("../logger"); // adapter selon ton path

function timingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;

    logger.info({
      msg: "request completed",
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration.toFixed(2)
    });
  });

  next();
}

module.exports = timingMiddleware;
