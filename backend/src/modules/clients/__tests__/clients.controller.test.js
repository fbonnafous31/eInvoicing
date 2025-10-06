/* global describe, it, expect, beforeEach */

const { getClients, createClient } = require('../clients.controller');
const ClientsService = require('../clients.service');

jest.mock('../clients.service');

describe('ClientsController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { seller: { id: 42 }, body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('getClients retourne la liste des clients', async () => {
    const mockClients = [{ id: 1, name: 'Alice' }];
    ClientsService.getClientsBySeller.mockResolvedValue(mockClients);

    await getClients(req, res);

    expect(ClientsService.getClientsBySeller).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith(mockClients);
  });

  it('createClient retourne 403 si seller manquant', async () => {
    req.seller = null;

    await createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Seller non identifié' });
  });
});
