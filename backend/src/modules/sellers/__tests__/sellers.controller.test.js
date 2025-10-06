/* global describe, it, expect, beforeEach */

const SellersController = require('../sellers.controller');
const SellersService = require('../sellers.service');

jest.mock('../sellers.service'); // mock complet du service

describe('SellersController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { sub: 'auth0|123' }, seller: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('createSeller : crée un vendeur avec succès', async () => {
    const newSeller = { id: 1, legal_name: 'Ma société' };
    SellersService.createSeller.mockResolvedValue(newSeller);

    await SellersController.createSeller(req, res);

    expect(SellersService.createSeller).toHaveBeenCalledWith(req.body, req.user.sub);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newSeller);
  });

  it('createSeller : retourne 400 si un vendeur existe déjà', async () => {
    req.seller = { id: 1 };

    await SellersController.createSeller(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Un vendeur existe déjà pour cet utilisateur" });
  });

  it('getSellerById : retourne 404 si vendeur non trouvé', async () => {
    SellersService.getSellerById.mockResolvedValue(null);
    req.params = { id: 42 };

    await SellersController.getSellerById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Vendeur non trouvé' });
  });
});
