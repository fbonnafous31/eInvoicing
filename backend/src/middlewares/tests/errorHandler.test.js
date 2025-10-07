/* global describe, it, expect, beforeEach */

const errorHandler = require('../errorHandler');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('errorHandler middleware', () => {
  let res;
  let req;
  let next;

  beforeEach(() => {
    res = createMockRes();
    req = {};
    next = jest.fn();
  });

  it('renvoie 400 pour une violation de contrainte d\'unicité spécifique', () => {
    const err = { code: '23505', constraint: 'invoice_taxes_invoice_id_vat_rate_key' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Vous ne pouvez pas saisir deux assiettes de TVA avec le même taux',
    });
  });

  it('renvoie 400 pour une autre violation d\'unicité', () => {
    const err = { code: '23505', constraint: 'autre_contrainte' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Violation de contrainte d’unicité',
    });
  });

  it('renvoie 400 pour une Error classique', () => {
    const err = new Error('Message personnalisé');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Message personnalisé',
    });
  });

  it('renvoie 500 pour une erreur inconnue', () => {
    const err = { unexpected: true };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erreur serveur',
    });
  });
});
