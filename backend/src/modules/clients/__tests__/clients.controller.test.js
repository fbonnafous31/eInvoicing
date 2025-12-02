/* global describe, it, expect, beforeEach, jest */

const pool = require('../../../config/db');
const ClientsService = require('../clients.service');

jest.mock('../clients.service');
jest.mock('../../../config/db', () => ({ query: jest.fn() }));

const ClientsController = require('../clients.controller');

describe('ClientsController', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      seller: { id: 42 }, 
      body: {}, 
      params: {}, 
      query: {}, 
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } 
    };

    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn() 
    };

    jest.clearAllMocks();
  });

  // -------- getClients --------
  it('getClients retourne la liste des clients', async () => {
    const mockClients = [{ id: 1, name: 'Alice' }];
    ClientsService.getClientsBySeller.mockResolvedValue(mockClients);

    await ClientsController.getClients(req, res);

    expect(ClientsService.getClientsBySeller).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith(mockClients);
  });

  it('getClients retourne 403 si seller manquant', async () => {
    req.seller = null;

    await ClientsController.getClients(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Seller non identifié' });
  });

  // -------- createClient --------
  it('createClient crée un client avec succès', async () => {
    const newClient = { id: 1, name: 'Bob' };
    ClientsService.createClient.mockResolvedValue(newClient);

    await ClientsController.createClient(req, res);

    expect(ClientsService.createClient).toHaveBeenCalledWith({}, 42);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newClient);
  });

  it('createClient retourne 400 si erreur SIRET', async () => {
    const error = new Error('SIRET invalide');
    ClientsService.createClient.mockRejectedValue(error);

    await ClientsController.createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  it('createClient retourne 500 si autre erreur serveur', async () => {
    const error = new Error('Autre erreur');
    ClientsService.createClient.mockRejectedValue(error);

    await ClientsController.createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur lors de la création' });
  });

  // -------- getClientById --------
  it('getClientById retourne le client', async () => {
    const client = { id: 1, name: 'Alice' };
    ClientsService.getClientById.mockResolvedValue(client);
    req.params.id = 1;

    await ClientsController.getClientById(req, res);

    expect(ClientsService.getClientById).toHaveBeenCalledWith(1, 42);
    expect(res.json).toHaveBeenCalledWith(client);
  });

  it('getClientById retourne 404 si client non trouvé', async () => {
    ClientsService.getClientById.mockResolvedValue(null);
    req.params.id = 1;

    await ClientsController.getClientById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Client non trouvé' });
  });

  it('getClientById retourne 403 si seller manquant', async () => {
    req.seller = null;

    await ClientsController.getClientById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Seller non identifié' });
  });

  // -------- deleteClient --------
  it('deleteClient supprime le client', async () => {
    const deleted = { id: 1 };
    ClientsService.deleteClient.mockResolvedValue(deleted);
    req.params.id = 1;

    await ClientsController.deleteClient(req, res);

    expect(ClientsService.deleteClient).toHaveBeenCalledWith(1, 42);
    expect(res.json).toHaveBeenCalledWith({ message: 'Client supprimé', client: deleted });
  });

  it('deleteClient retourne 403 si seller manquant', async () => {
    req.seller = null;

    await ClientsController.deleteClient(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Seller non identifié' });
  });

  it('deleteClient retourne 404 si erreur', async () => {
    const error = new Error('Client not found');
    ClientsService.deleteClient.mockRejectedValue(error);
    req.params.id = 1;

    await ClientsController.deleteClient(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  // -------- updateClient --------
  it('updateClient met à jour le client', async () => {
    const updated = { id: 1, name: 'Updated' };
    ClientsService.updateClientData.mockResolvedValue(updated);
    req.params.id = 1;

    await ClientsController.updateClient(req, res);

    expect(ClientsService.updateClientData).toHaveBeenCalledWith(1, {}, 42);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('updateClient retourne 400 si SIRET invalide', async () => {
    const error = new Error('SIRET invalide');
    ClientsService.updateClientData.mockRejectedValue(error);
    req.params.id = 1;

    await ClientsController.updateClient(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  it('updateClient retourne 404 si not found', async () => {
    const error = new Error('Client not found');
    ClientsService.updateClientData.mockRejectedValue(error);
    req.params.id = 1;

    await ClientsController.updateClient(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  it('updateClient retourne 500 si autre erreur serveur', async () => {
    const error = new Error('Autre erreur');
    ClientsService.updateClientData.mockRejectedValue(error);
    req.params.id = 1;

    await ClientsController.updateClient(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
  });

  it('updateClient retourne 403 si seller manquant', async () => {
    req.seller = null;

    await ClientsController.updateClient(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Seller non identifié' });
  });

  // -------- checkSiret --------
  it('checkSiret retourne exists true si SIRET trouvé', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });
    req.params.siret = '12345678901234';

    await ClientsController.checkSiret(req, res);

    expect(res.json).toHaveBeenCalledWith({ exists: true });
  });

  it('checkSiret retourne exists false si SIRET non trouvé', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });
    req.params.siret = '12345678901234';

    await ClientsController.checkSiret(req, res);

    expect(res.json).toHaveBeenCalledWith({ exists: false });
  });

  it('checkSiret retourne 500 si erreur serveur', async () => {
    pool.query.mockRejectedValue(new Error('Erreur'));
    req.params.siret = '12345678901234';

    await ClientsController.checkSiret(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur serveur' });
  });
});
