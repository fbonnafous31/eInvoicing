// tests/db.test.js
jest.mock('pg', () => {
  const actual = jest.requireActual('pg');
  return {
    ...actual,
    Pool: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    })),
    types: {
      setTypeParser: jest.fn(),
    },
  };
});

describe('DB setup', () => {
  it('devrait configurer le type DATE et exporter un pool', () => {
    const { Pool, types } = require('pg');
    // Recharger le module db
    const pool = require('../db');

    // Le type parser doit être configuré
    expect(types.setTypeParser).toHaveBeenCalledWith(1082, expect.any(Function));
    // Le Pool doit avoir été instancié
    expect(Pool).toHaveBeenCalled();
    // Le module exporte bien un objet
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });
});
