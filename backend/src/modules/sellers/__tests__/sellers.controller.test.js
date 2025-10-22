/* global describe, it, expect, beforeEach, jest */

const SellersController = require('../sellers.controller');
const SellersService = require('../sellers.service');

jest.mock('../sellers.service'); // mock complet du service

describe('SellersController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {}, user: { sub: 'auth0|123' }, seller: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Supprimer les logs intempestifs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
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
    req.params.id = 42;

    await SellersController.getSellerById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Vendeur non trouvé' });
  });

  it('getSellers : renvoie la liste des vendeurs', async () => {
    const sellers = [{ id: 1 }, { id: 2 }];
    SellersService.listSellers.mockResolvedValue(sellers);

    await SellersController.getSellers(req, res);

    expect(res.json).toHaveBeenCalledWith(sellers);
  });

  it('getSellers : gère l\'erreur serveur', async () => {
    SellersService.listSellers.mockRejectedValue(new Error('Erreur serveur'));

    await SellersController.getSellers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
  });

  it('getMySeller : succès', async () => {
    const seller = { id: 1 };
    SellersService.getSellerByAuth0Id.mockResolvedValue(seller);

    await SellersController.getMySeller(req, res, next);

    expect(res.json).toHaveBeenCalledWith(seller);
  });

  it('getMySeller : aucun vendeur trouvé', async () => {
    SellersService.getSellerByAuth0Id.mockResolvedValue(null);

    await SellersController.getMySeller(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Aucun vendeur trouvé pour cet utilisateur" });
  });

  it('getMySeller : erreur serveur appelle next', async () => {
    const error = new Error('Boom');
    SellersService.getSellerByAuth0Id.mockRejectedValue(error);

    await SellersController.getMySeller(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('deleteSeller : succès', async () => {
    const deleted = { id: 1 };
    SellersService.deleteSeller.mockResolvedValue(deleted);
    req.params.id = 1;

    await SellersController.deleteSeller(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Seller deleted', seller: deleted });
  });

  it('deleteSeller : erreur', async () => {
    const err = new Error('Not found');
    SellersService.deleteSeller.mockRejectedValue(err);
    req.params.id = 1;

    await SellersController.deleteSeller(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: err.message });
  });

  it('updateSeller : succès', async () => {
    const updated = { id: 1, name: 'New' };
    SellersService.updateSellerData.mockResolvedValue(updated);
    req.params.id = 1;
    req.body = { name: 'New' };

    await SellersController.updateSeller(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('updateSeller : erreur', async () => {
    const err = new Error('Not found');
    SellersService.updateSellerData.mockRejectedValue(err);
    req.params.id = 1;
    req.body = { name: 'New' };

    await SellersController.updateSeller(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: err.message });
  });

  it('checkIdentifier : succès', async () => {
    SellersService.checkIdentifierExists.mockResolvedValue(true);
    req.query.identifier = 'abc';
    req.query.id = '123';

    await SellersController.checkIdentifier(req, res);

    expect(res.json).toHaveBeenCalledWith({ exists: true });
  });

  it('testSmtp : succès', async () => {
    const smtpResult = { ok: true };
    SellersService.testSmtp.mockResolvedValue(smtpResult);
    req.body = { host: 'smtp.test.com', port: 587 };

    await SellersController.testSmtp(req, res);

    expect(res.json).toHaveBeenCalledWith(smtpResult);
  });

  it('testSmtp : erreur', async () => {
    const err = new Error('SMTP down');
    SellersService.testSmtp.mockRejectedValue(err);
    req.body = { host: 'bad', port: 123 };

    await SellersController.testSmtp(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: err.message });
  });
});
