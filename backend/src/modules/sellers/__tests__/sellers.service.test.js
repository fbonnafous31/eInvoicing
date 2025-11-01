/* global describe, it, expect, afterEach, jest */

const db = require('../../../config/db');
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

// Mock complet du modèle
const SellersModel = require('../sellers.model');
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

// Mock de la DB pour les requêtes directes
jest.mock('../../../config/db', () => ({
  query: jest.fn(),
}));

// Mock complet du module encryption avant d'importer le service
jest.mock('../../../utils/encryption', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn().mockReturnValue('decrypted'),
}));

const SellersService = require('../sellers.service');

describe('SellersService', () => {
  const auth0_id = 'auth0|123';
  const sellerId = 42;

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---- Méthodes utilisant SellersModel ----
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

  // ---- Méthodes utilisant db.query ----
  it('getSellerByAuth0Id retourne un vendeur', async () => {
    const sellerRow = { id: 1, name: 'Alice' };
    const smtpRow = { id: 1, smtp_host: 'smtp.example.com' };
    
    // Mock de la DB
    db.query
      .mockResolvedValueOnce({ rows: [sellerRow] }) // première requête : seller
      .mockResolvedValueOnce({ rows: [smtpRow] });  // deuxième requête : SMTP

    const result = await SellersService.getSellerByAuth0Id(auth0_id);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE auth0_id = $1'),
      [auth0_id]
    );

    // On attend maintenant que smtp soit dans un sous-objet
    expect(result).toEqual({ ...sellerRow, smtp: smtpRow });
  });

  it('getSellerByAuth0Id retourne null si aucun résultat', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await SellersService.getSellerByAuth0Id(auth0_id);

    expect(result).toBeNull();
  });

  it('getSellerByAuth0Id retourne null si auth0_id absent', async () => {
    const result = await SellersService.getSellerByAuth0Id(null);
    expect(result).toBeNull();
  });

  it('checkIdentifierExists retourne true si identifiant existe', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });

    const result = await SellersService.checkIdentifierExists('ABC123', null);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE legal_identifier = $1'),
      ['ABC123', null]
    );
    expect(result).toBe(true);
  });

  it('checkIdentifierExists retourne false si identifiant n’existe pas', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });

    const result = await SellersService.checkIdentifierExists('ABC123', 1);

    expect(result).toBe(false);
  });

  // ---- getMySeller ----
  it('getMySeller appelle getSellerByAuth0Id et retourne le vendeur', async () => {
    const sellerRow = { id: 1, name: 'Alice' };
    const smtpRow = { id: 1, smtp_host: 'smtp.example.com' };

    db.query
      .mockResolvedValueOnce({ rows: [sellerRow] }) // seller
      .mockResolvedValueOnce({ rows: [smtpRow] });  // smtp

    const result = await SellersService.getMySeller(auth0_id);

    expect(result).toEqual({ ...sellerRow, smtp: smtpRow });
  });

  it('getMySeller retourne null si auth0_id absent', async () => {
    const result = await SellersService.getMySeller(null);
    expect(result).toBeNull();
  });

  it('getSellerByAuth0Id décrypte smtp_pass correctement', async () => {
    const sellerRow = { id: 1, name: 'Alice' };
    const smtpRow = { id: 1, smtp_host: 'smtp.example.com', smtp_pass: 'encrypted' };

    // Mock de la DB
    db.query
      .mockResolvedValueOnce({ rows: [sellerRow] })  // seller
      .mockResolvedValueOnce({ rows: [smtpRow] });   // SMTP

    const result = await SellersService.getSellerByAuth0Id(auth0_id);

    const encryption = require('../../../utils/encryption');

    // Vérifie que decrypt a été appelé avec la valeur de la DB
    expect(encryption.decrypt).toHaveBeenCalledWith('encrypted');

    // Vérifie que le résultat contient bien le mot de passe décrypté
    expect(result.smtp.smtp_pass).toBe('decrypted');
  });
});
