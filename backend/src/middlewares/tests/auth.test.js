/* global describe, it, expect, beforeEach, afterEach, jest */
// On mock express-jwt et jwks-rsa
jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(() => (req, res, next) => next()), // par défaut, succès
}));
jest.mock("jwks-rsa", () => ({
  expressJwtSecret: jest.fn(() => "mock-secret"),
}));

const withLogging = require("../auth");

describe("withLogging middleware", () => {
  let req, res, next;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("appelle next() si tout est correct", () => {
    // JWT factice valide pour que JSON.parse ne plante pas
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "123" })).toString("base64");
    const signature = "signature";
    req.headers.authorization = `Bearer ${header}.${payload}.${signature}`;

    withLogging(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("log un warning si aucun header Authorization", () => {
    withLogging(req, res, next);

    expect(consoleWarnSpy).toHaveBeenCalledWith("⚠️ Aucun header Authorization trouvé !");
    expect(next).toHaveBeenCalled();
  });

  it("log une erreur si token mal formé", () => {
    req.headers.authorization = "Bearer bad.token";

    withLogging(req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("❌ Impossible de décoder le token :"),
      expect.any(String) // message d'erreur réel
    );
    expect(next).toHaveBeenCalled();
  });

  it("envoie une réponse 401 si checkJwt échoue", () => {
    // On réinitialise les modules pour pouvoir mocker avant import
    jest.resetModules();

    const expressjwt = require("express-jwt");
    expressjwt.expressjwt.mockImplementation(() => (req, res, next) => {
      const err = { status: 401, message: "JWT invalide", name: "UnauthorizedError" };
      return next(err);
    });

    // Re-require du middleware après avoir mocké express-jwt
    const withLogging = require("../auth");

    // JWT factice valide
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64");
    const payload = Buffer.from(JSON.stringify({ sub: "123" })).toString("base64");
    const signature = "signature";
    req.headers.authorization = `Bearer ${header}.${payload}.${signature}`;

    withLogging(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "JWT invalide" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ checkJwt a échoué :",
      "UnauthorizedError",
      "-",
      "JWT invalide"
    );
    expect(next).not.toHaveBeenCalled();
  });
});
