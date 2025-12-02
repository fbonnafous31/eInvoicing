const pino = require("pino");
const path = require("path");
const fs = require("fs");

// Crée le dossier logs
const logDirectory = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });

// Nom du fichier journalier
const date = new Date().toISOString().split("T")[0];
const logFile = path.join(logDirectory, `app-${date}.log`);

// Flux destination fichier
const fileStream = pino.destination({ dest: logFile, sync: false });

// Flux console lisible
const prettyStream = pino.transport({
  target: "pino-pretty",
  options: { colorize: true, translateTime: "SYS:standard" },
});

// Logger multi-stream
const logger = pino({}, pino.multistream([
  { stream: prettyStream },
  { stream: fileStream }
]));

module.exports = logger;
