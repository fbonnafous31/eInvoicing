/* global describe, it, expect, afterEach */

// src/modules/clients/__tests__/clients.model.test.js
const ClientsModel = require('../clients.model');
const pool = require('../../../config/db');

jest.mock('../../../config/db'); // on mock complètement la DB

describe('ClientsModel', () => {
  const sellerId = 42;
  const clientId = 1;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getClientsBySeller retourne les clients du seller', async () => {
    const mockClients = [{ id: 1, legal_name: 'Alice' }];
    pool.query.mockResolvedValueOnce({ rows: mockClients });

    const result = await ClientsModel.getClientsBySeller(sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [sellerId]);
    expect(result).toEqual(mockClients);
  });

  it('insertClient insère un client et retourne le résultat', async () => {
    const clientData = {
      is_company: true,
      legal_name: 'Bob',
      country_code: 'FR',
      siret: '12345678901234'
    };
    const mockClient = { id: clientId, ...clientData };
    
    // Mock pour checkSiretUnique
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    // Mock pour INSERT
    pool.query.mockResolvedValueOnce({ rows: [mockClient] });

    const result = await ClientsModel.insertClient(clientData, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
    expect(result).toEqual(mockClient);
  });

  it('getClientById retourne le client correspondant', async () => {
    const mockClient = { id: clientId, legal_name: 'Charlie' };
    pool.query.mockResolvedValueOnce({ rows: [mockClient] });

    const result = await ClientsModel.getClientById(clientId, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [clientId, sellerId]);
    expect(result).toEqual(mockClient);
  });

  it('updateClient met à jour le client', async () => {
    const clientData = {
      is_company: true,
      legal_name: 'Updated Name',
      country_code: 'FR',
      siret: '12345678901234'
    };
    const updatedClient = { id: clientId, ...clientData };

    // Mock pour checkSiretUnique
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    // Mock pour UPDATE
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [updatedClient] });

    const result = await ClientsModel.updateClient(clientId, clientData, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
    expect(result).toEqual(updatedClient);
  });

  it('removeClient supprime le client et retourne le résultat', async () => {
    const deletedClient = { id: clientId, legal_name: 'Deleted' };
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [deletedClient] });

    const result = await ClientsModel.removeClient(clientId, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [clientId, sellerId]);
    expect(result).toEqual(deletedClient);
  });
});
