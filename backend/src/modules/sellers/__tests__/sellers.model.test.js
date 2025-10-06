/* global describe, it, expect, afterEach */

// tests/models/sellers.model.test.js
const SellersModel = require('../../../modules/sellers/sellers.model');
const pool = require('../../../config/db');

jest.mock('../../../config/db');

describe('SellersModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAllSellers doit appeler la DB et retourner les rows', async () => {
    const mockRows = [{ id: 1, legal_name: 'Société A' }];
    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await SellersModel.getAllSellers();

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, legal_name, legal_identifier')
    );
    expect(result).toEqual(mockRows);
  });

  it('insertSeller doit insérer un seller et retourner le résultat', async () => {
    const sellerData = { legal_name: 'Société B', legal_identifier: '12345', country_code: 'FR' };
    const auth0_id = 'auth0|123';
    const mockRow = { id: 2, ...sellerData, auth0_id };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await SellersModel.insertSeller(sellerData, auth0_id);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO invoicing.sellers'),
      expect.arrayContaining([sellerData.legal_name, sellerData.legal_identifier, sellerData.country_code, auth0_id])
    );
    expect(result).toEqual(mockRow);
  });

  it('getSellerById retourne le seller correspondant', async () => {
    const mockRow = { id: 1, legal_name: 'Société A' };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await SellersModel.getSellerById(1);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM invoicing.sellers WHERE id = $1',
      [1]
    );
    expect(result).toEqual(mockRow);
  });

  it('removeSeller supprime un seller existant', async () => {
    const mockRow = { id: 1, legal_name: 'Société A' };
    pool.query.mockResolvedValue({ rowCount: 1, rows: [mockRow] });

    const result = await SellersModel.removeSeller(1);

    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM invoicing.sellers WHERE id = $1 RETURNING *',
      [1]
    );
    expect(result).toEqual(mockRow);
  });

  it('updateSeller met à jour un seller et retourne le résultat', async () => {
    const sellerData = { legal_name: 'Société C', legal_identifier: '67890', country_code: 'FR' };
    const mockRow = { id: 3, ...sellerData };
    pool.query.mockResolvedValue({ rowCount: 1, rows: [mockRow] });

    const result = await SellersModel.updateSeller(3, sellerData);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE invoicing.sellers'),
      expect.arrayContaining([sellerData.legal_name, sellerData.legal_identifier, sellerData.country_code, 3])
    );
    expect(result).toEqual(mockRow);
  });
});
