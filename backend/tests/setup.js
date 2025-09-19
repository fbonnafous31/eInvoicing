import { vi } from "vitest";

vi.mock("../backend/middlewares/auth.js", () => ({
  default: (req, res, next) => {
    req.user = { sub: "auth0|test-user" };
    next();
  },
}));

vi.mock("../backend/middlewares/attachSeller.js", () => ({
  default: (req, res, next) => {
    req.seller = { id: 1, name: "Test Seller" };
    next();
  },
}));
