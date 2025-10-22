/* global describe, it, expect, afterEach */

// tests/modules/sellers/getAllSellers.test.js
const { getAllSellers } = require('../../../modules/sellers/sellers.model');
const pool = require('../../../config/db');

jest.mock('../../../config/db');

describe('getAllSellers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('doit appeler la DB et retourner les rows', async () => {
    const mockRows = [
      { id: 1, legal_name: 'Société A', legal_identifier: '12345' },
      { id: 2, legal_name: 'Société B', legal_identifier: '67890' }
    ];

    // On mock la réponse de pool.query
    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await getAllSellers();

    // Vérifie que pool.query a été appelé avec la bonne requête SQL
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, legal_name, legal_identifier')
    );

    // Vérifie que la fonction retourne bien les rows mockées
    expect(result).toEqual(mockRows);
  });

  it('doit gérer un retour vide', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await getAllSellers();

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('doit propager les erreurs de la DB', async () => {
    const error = new Error('DB error');
    pool.query.mockRejectedValue(error);

    await expect(getAllSellers()).rejects.toThrow('DB error');
    expect(pool.query).toHaveBeenCalled();
  });
});
