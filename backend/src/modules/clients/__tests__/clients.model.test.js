/* global describe, it, expect, afterEach, jest */

const ClientsModel = require('../clients.model');
const pool = require('../../../config/db');

jest.mock('../../../config/db'); // Mock complet de la DB

describe('ClientsModel', () => {
  const sellerId = 42;
  const clientId = 1;

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ----------------- getAllClients -----------------
  it('getAllClients retourne tous les clients', async () => {
    const mockClients = [{ id: 1, legal_name: 'Alice' }];
    pool.query.mockResolvedValueOnce({ rows: mockClients });

    const result = await ClientsModel.getAllClients();

    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
    expect(result).toEqual(mockClients);
  });

  // ----------------- getClientsBySeller -----------------
  it('getClientsBySeller retourne les clients d’un seller', async () => {
    const mockClients = [{ id: clientId, legal_name: 'Bob' }];
    pool.query.mockResolvedValueOnce({ rows: mockClients });

    const result = await ClientsModel.getClientsBySeller(sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [sellerId]);
    expect(result).toEqual(mockClients);
  });

  // ----------------- getClientById -----------------
  it('getClientById retourne le client correspondant', async () => {
    const mockClient = { id: clientId, legal_name: 'Charlie' };
    pool.query.mockResolvedValueOnce({ rows: [mockClient] });

    const result = await ClientsModel.getClientById(clientId, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [clientId, sellerId]);
    expect(result).toEqual(mockClient);
  });

  // ----------------- insertClient -----------------
  it('insertClient insère un client avec SIRET valide', async () => {
    const clientData = { is_company: true, legal_name: 'Delta', country_code: 'FR', siret: '12345678901234' };
    const mockClient = { id: clientId, ...clientData };

    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // checkSiretUnique
    pool.query.mockResolvedValueOnce({ rows: [mockClient] }); // INSERT

    const result = await ClientsModel.insertClient(clientData, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
    expect(result).toEqual(mockClient);
  });

  it('insertClient échoue si SIRET déjà existant', async () => {
    const clientData = { is_company: true, legal_name: 'Echo', country_code: 'FR', siret: '12345678901234' };
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2 }] }); // checkSiretUnique

    await expect(ClientsModel.insertClient(clientData, sellerId))
      .rejects
      .toThrow('Ce SIRET est déjà utilisé par un autre client');
  });

  it('insertClient échoue si validation invalide', async () => {
    const clientData = { is_company: true, country_code: 'FR', siret: '123' }; // pas de legal_name + SIRET invalide
    await expect(ClientsModel.insertClient(clientData, sellerId))
      .rejects
      .toThrow('Le nom légal est requis pour une entreprise');
  });

  // ----------------- updateClient -----------------
  it('updateClient met à jour un client', async () => {
    const clientData = { is_company: true, legal_name: 'Foxtrot', country_code: 'FR', siret: '12345678901234' };
    const updatedClient = { id: clientId, ...clientData };

    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // checkSiretUnique
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [updatedClient] }); // UPDATE

    const result = await ClientsModel.updateClient(clientId, clientData, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
    expect(result).toEqual(updatedClient);
  });

  it('updateClient échoue si client non trouvé', async () => {
    const clientData = { is_company: true, legal_name: 'Golf', country_code: 'FR', siret: '12345678901234' };
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // checkSiretUnique
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // UPDATE

    await expect(ClientsModel.updateClient(clientId, clientData, sellerId))
      .rejects
      .toThrow('Client not found');
  });

  // ----------------- removeClient -----------------
  it('removeClient supprime un client', async () => {
    const deletedClient = { id: clientId, legal_name: 'Hotel' };
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [deletedClient] });

    const result = await ClientsModel.removeClient(clientId, sellerId);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [clientId, sellerId]);
    expect(result).toEqual(deletedClient);
  });

  it('removeClient échoue si client non trouvé', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(ClientsModel.removeClient(clientId, sellerId))
      .rejects
      .toThrow('Client not found');
  });

  // ----------------- validateClientData - tests unitaires -----------------
  it('validateClientData lance une erreur pour un particulier avec SIRET', () => {
    const data = { is_company: false, firstname: 'John', lastname: 'Doe', siret: '123' };
    expect(() => ClientsModel.insertClient(data, sellerId)).rejects.toBeDefined();
  });

  it('validateClientData lance une erreur si email invalide', () => {
    const data = { is_company: true, legal_name: 'India', country_code: 'FR', siret: '12345678901234', email: 'bademail' };
    expect(() => ClientsModel.insertClient(data, sellerId)).rejects.toBeDefined();
  });

  it('validateClientData lance une erreur si phone invalide', () => {
    const data = { is_company: true, legal_name: 'Juliet', country_code: 'FR', siret: '12345678901234', phone: 'abcd' };
    expect(() => ClientsModel.insertClient(data, sellerId)).rejects.toBeDefined();
  });
});
