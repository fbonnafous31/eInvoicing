/* global describe, it, expect, beforeAll */
jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(() => "mocked-jwt"),
}));
jest.mock("jwks-rsa", () => ({
  expressJwtSecret: jest.fn(() => "mock-secret"),
}));

describe("checkJwt middleware configuration", () => {
  beforeAll(() => {
    // Définir les variables d'environnement avant de require
    process.env.AUTH0_DOMAIN = "test-domain";
    process.env.AUTH0_AUDIENCE = "test-audience";

    // Require simplement le middleware pour que le code s'exécute
    require("../auth");
  });

  it("devrait appeler expressjwt avec la bonne configuration", () => {
    const { expressjwt: mockedJwt } = require("express-jwt");
    const { expressJwtSecret } = require("jwks-rsa");

    expect(expressJwtSecret).toHaveBeenCalledWith(expect.objectContaining({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: "https://test-domain/.well-known/jwks.json",
    }));

    expect(mockedJwt).toHaveBeenCalledWith(expect.objectContaining({
      secret: "mock-secret",
      audience: "test-audience",
      issuer: "https://test-domain/",
      algorithms: ["RS256"],
      requestProperty: "user",
    }));
  });
});
