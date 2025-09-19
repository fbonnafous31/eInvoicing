// src/utils/__tests__/siret.test.js
const { isValidSiret } = require("../siret.js");

describe("isValidSiret", () => {
  test("accepte un SIRET valide", () => {
    expect(isValidSiret("73282932000074")).toBe(true);
  });

  test("rejette un SIRET invalide", () => {
    expect(isValidSiret("12345678901234")).toBe(false);
  });
});
