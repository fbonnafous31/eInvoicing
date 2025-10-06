// tests/services/clients.service.test.js
const ClientsModel = require('../clients.model'); 
const ClientsService = require('../clients.service'); 
const { describe, it, expect, afterEach } = globalThis;

jest.mock('../clients.model'); 

describe('ClientsService', () => {
  const sellerId = 42;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getClientsBySeller appelle le modèle et retourne les clients', async () => {
    const mockClients = [{ id: 1, name: 'Alice' }];
    ClientsModel.getClientsBySeller.mockResolvedValue(mockClients);

    const result = await ClientsService.getClientsBySeller(sellerId);

    expect(ClientsModel.getClientsBySeller).toHaveBeenCalledWith(sellerId);
    expect(result).toEqual(mockClients);
  });

  it('createClient appelle le modèle avec les bons arguments', async () => {
    const clientData = { name: 'Bob' };
    const mockClient = { id: 2, ...clientData };
    ClientsModel.insertClient.mockResolvedValue(mockClient);

    const result = await ClientsService.createClient(clientData, sellerId);

    expect(ClientsModel.insertClient).toHaveBeenCalledWith(clientData, sellerId);
    expect(result).toEqual(mockClient);
  });

  it('getClientById retourne le client correspondant', async () => {
    const mockClient = { id: 3, name: 'Charlie' };
    ClientsModel.getClientById.mockResolvedValue(mockClient);

    const result = await ClientsService.getClientById(3, sellerId);

    expect(ClientsModel.getClientById).toHaveBeenCalledWith(3, sellerId);
    expect(result).toEqual(mockClient);
  });

  it('deleteClient appelle le modèle et retourne la valeur', async () => {
    ClientsModel.removeClient.mockResolvedValue(true);

    const result = await ClientsService.deleteClient(3, sellerId);

    expect(ClientsModel.removeClient).toHaveBeenCalledWith(3, sellerId);
    expect(result).toBe(true);
  });

  it('updateClientData appelle le modèle avec les bons arguments', async () => {
    const clientData = { name: 'Updated Name' };
    const mockClient = { id: 3, ...clientData };
    ClientsModel.updateClient.mockResolvedValue(mockClient);

    const result = await ClientsService.updateClientData(3, clientData, sellerId);

    expect(ClientsModel.updateClient).toHaveBeenCalledWith(3, clientData, sellerId);
    expect(result).toEqual(mockClient);
  });
});
