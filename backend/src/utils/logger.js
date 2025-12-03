const pino = require("pino");
const path = require("path");
const fs = require("fs");

// --- Dossier logs --- //
const logDirectory = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });

// --- Fichier journalier --- //
const date = new Date().toISOString().split("T")[0];
const logFile = path.join(logDirectory, `app-${date}.log`);

// --- Streams --- //
const fileStream = pino.destination({ dest: logFile, sync: false });
const prettyStream = pino.transport({
  target: "pino-pretty",
  options: { colorize: true, translateTime: "SYS:standard" },
});

// --- Serializers --- //
const serializers = {
  ...pino.stdSerializers,
  req: (req) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    user: req.user ? { id: req.user.id } : null
  }),
  res: (res) => ({
    statusCode: res.statusCode,
  }),
};

// --- Logger final --- //
const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    serializers,
    base: {
      env: process.env.NODE_ENV || "development",
      app: "einvoicing",
    },
  },
  pino.multistream([
    { stream: prettyStream },
    { stream: fileStream }
  ])
);

module.exports = logger;
