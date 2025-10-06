// tests/services/sellers.service.test.js
const SellersModel = require('../sellers.model');

// Mock complet du modèle avant d'importer le service
jest.mock('../sellers.model', () => ({
  getAllSellers: jest.fn(),
  insertSeller: jest.fn(),
  getSellerById: jest.fn(),
  removeSeller: jest.fn(),
  updateSeller: jest.fn(),
  getSellerByAuth0Id: jest.fn(),
  checkIdentifierExists: jest.fn(),
  getMySeller: jest.fn(),
}));

const SellersService = require('../sellers.service');

const { describe, it, expect, afterEach } = globalThis;

describe('SellersService', () => {
  const auth0_id = 'auth0|123';
  const sellerId = 42;

  afterEach(() => {
    Object.values(SellersModel).forEach(fn => fn.mockClear());
  });

  it('listSellers appelle le modèle et retourne les vendeurs', async () => {
    const mockSellers = [{ id: 1, name: 'Alice' }];
    SellersModel.getAllSellers.mockResolvedValue(mockSellers);

    const result = await SellersService.listSellers();

    expect(SellersModel.getAllSellers).toHaveBeenCalled();
    expect(result).toEqual(mockSellers);
  });

  it('createSeller appelle le modèle avec les bons arguments', async () => {
    const sellerData = { name: 'Bob' };
    const mockSeller = { id: sellerId, ...sellerData };
    SellersModel.insertSeller.mockResolvedValue(mockSeller);

    const result = await SellersService.createSeller(sellerData, auth0_id);

    expect(SellersModel.insertSeller).toHaveBeenCalledWith(sellerData, auth0_id);
    expect(result).toEqual(mockSeller);
  });

  it('getSellerById retourne le vendeur correspondant', async () => {
    const mockSeller = { id: sellerId, name: 'Charlie' };
    SellersModel.getSellerById.mockResolvedValue(mockSeller);

    const result = await SellersService.getSellerById(sellerId);

    expect(SellersModel.getSellerById).toHaveBeenCalledWith(sellerId);
    expect(result).toEqual(mockSeller);
  });

  it('deleteSeller appelle le modèle et retourne la valeur', async () => {
    SellersModel.removeSeller.mockResolvedValue(true);

    const result = await SellersService.deleteSeller(sellerId);

    expect(SellersModel.removeSeller).toHaveBeenCalledWith(sellerId);
    expect(result).toBe(true);
  });

  it('updateSellerData appelle le modèle avec les bons arguments', async () => {
    const sellerData = { name: 'Updated Name' };
    const mockSeller = { id: sellerId, ...sellerData };
    SellersModel.updateSeller.mockResolvedValue(mockSeller);

    const result = await SellersService.updateSellerData(sellerId, sellerData);

    expect(SellersModel.updateSeller).toHaveBeenCalledWith(sellerId, sellerData);
    expect(result).toEqual(mockSeller);
  });
});
