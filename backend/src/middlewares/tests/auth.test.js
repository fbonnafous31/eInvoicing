/* global describe, it, expect, beforeEach, jest */

jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(() => (req, res, next) => next()), // succès par défaut
}));
jest.mock("jwks-rsa", () => ({
  expressJwtSecret: jest.fn(() => "mock-secret"),
}));
jest.mock("../../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const logger = require("../../utils/logger");
const expressjwt = require("express-jwt");
const withLogging = require("../auth");

describe("withLogging middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("appelle next() si tout est correct", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "123" })).toString("base64");
    req.headers.authorization = `Bearer ${header}.${payload}.signature`;

    withLogging(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("log un warning si aucun header Authorization", () => {
    withLogging(req, res, next);

    expect(logger.warn).toHaveBeenCalledWith("⚠️ Aucun header Authorization trouvé !");
    expect(next).toHaveBeenCalled();
  });

  it("log une erreur si token mal formé", () => {
    req.headers.authorization = "Bearer bad.token";

    withLogging(req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("❌ Impossible de décoder le token :"),
      expect.any(String)
    );
    expect(next).toHaveBeenCalled();
  });

  it("envoie une réponse 401 si checkJwt échoue", () => {
    // on mock express-jwt pour ce test
    expressjwt.expressjwt.mockImplementation(() => (req, res, next) => {
      const err = { status: 401, message: "JWT invalide", name: "UnauthorizedError" };
      next(err);
    });

    // on doit réimporter le middleware APRES avoir mocké express-jwt
    let withLoggingLocal;
    jest.isolateModules(() => {
      withLoggingLocal = require("../auth");
    });

    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "123" })).toString("base64");
    const signature = "signature";
    req.headers.authorization = `Bearer ${header}.${payload}.${signature}`;

    withLoggingLocal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "JWT invalide" });
    expect(logger.error).toHaveBeenCalledWith(
      "❌ checkJwt a échoué :",
      "UnauthorizedError",
      "-",
      "JWT invalide"
    );

    // next ne doit pas être appelé
    expect(next).not.toHaveBeenCalled();
  });

});
