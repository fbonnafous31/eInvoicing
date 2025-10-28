// src/middlewares/tests/attachSeller.test.js

/* global describe, it, expect, beforeEach, beforeAll, afterAll */

const attachSeller = require('../attachSeller');
const sellersService = require('../../modules/sellers/sellers.service');

// 🧩 Mock complet du service
jest.mock('../../modules/sellers/sellers.service');

// 🧩 Mock du module encryption pour éviter l'erreur d'import ESM
jest.mock('../../utils/encryption', () => ({
  encrypt: jest.fn((v) => v),
  decrypt: jest.fn((v) => v),
}));

describe('attachSeller middleware', () => {
  let req, res, next;

  beforeAll(() => {
    // Mock console pour éviter le spam
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
  });

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('attache le vendeur si req.user.sub existe', async () => {
    req.user = { sub: 'auth0|123' };
    const mockSeller = { id: 1, name: 'Test Seller' };
    sellersService.getSellerByAuth0Id.mockResolvedValue(mockSeller);

    await attachSeller(req, res, next);

    expect(sellersService.getSellerByAuth0Id).toHaveBeenCalledWith('auth0|123');
    expect(req.seller).toEqual(mockSeller);
    expect(next).toHaveBeenCalled();
  });

  it('met req.seller à null si aucun vendeur trouvé', async () => {
    req.user = { sub: 'auth0|456' };
    sellersService.getSellerByAuth0Id.mockResolvedValue(null);

    await attachSeller(req, res, next);

    expect(req.seller).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it('ignore si req.user est undefined', async () => {
    await attachSeller(req, res, next);

    expect(sellersService.getSellerByAuth0Id).not.toHaveBeenCalled();
    expect(req.seller).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('appelle next avec l\'erreur si getSellerByAuth0Id échoue', async () => {
    const error = new Error('DB error');
    req.user = { sub: 'auth0|789' };
    sellersService.getSellerByAuth0Id.mockRejectedValue(error);

    await attachSeller(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
