/* global describe, it, expect, beforeEach, jest */

// backend/src/middlewares/tests/auth.test.js
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
    req = { headers: {}, path: "/test", method: "GET" };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("envoie une 401 si aucun header Authorization", () => {
    withLogging(req, res, next);

    expect(logger.warn).toHaveBeenCalledWith("⚠️ Aucun header Authorization trouvé !");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or missing token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("envoie une 401 si checkJwt échoue", () => {
    expressjwt.expressjwt.mockImplementation(() => (req, res, next) => {
      const err = { status: 401, message: "JWT invalide", name: "UnauthorizedError" };
      next(err);
    });

    // réimport du middleware après mock express-jwt
    jest.isolateModules(() => {
      const withLoggingLocal = require("../auth");
      const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64");
      const payload = Buffer.from(JSON.stringify({ sub: "123" })).toString("base64");
      req.headers.authorization = `Bearer ${header}.${payload}.signature`;

      withLoggingLocal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or missing token" });
      expect(logger.error).toHaveBeenCalledWith(
        "❌ checkJwt failed",
        expect.objectContaining({
          name: "UnauthorizedError",
          message: "JWT invalide",
          status: 401,
          path: "/test",
          method: "GET",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  it("envoie une 401 si header Authorization malformé (pas Bearer)", () => {
    req.headers.authorization = "Basic sometoken";
    withLogging(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or missing token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("envoie une 401 si token avec pas assez de segments", () => {
    req.headers.authorization = "Bearer tokenSansPoint";
    withLogging(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or missing token" });
  });

  it("envoie une 401 si alg différent de RS256", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "123" })).toString("base64");
    req.headers.authorization = `Bearer ${header}.${payload}.signature`;
    withLogging(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(logger.warn).toHaveBeenCalledWith(
      "❌ Token with unexpected alg detected",
      expect.objectContaining({ alg: "HS256" })
    );
  });

  it("envoie une 401 si header du token n'est pas du JSON valide", () => {
    const badHeader = Buffer.from("not-json").toString("base64");
    req.headers.authorization = `Bearer ${badHeader}.payload.signature`;
    withLogging(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(logger.warn).toHaveBeenCalledWith(
      "❌ Cannot parse token header",
      expect.any(Object)
    );
  });

  it("appelle next() et log succès si JWT valide", () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64");
    req.headers.authorization = `Bearer ${header}.${payload}.signature`;
    req.user = { sub: "user-123" };
    withLogging(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "✅ JWT valid",
      expect.objectContaining({ sub: "user-123" })
    );
  });
});
