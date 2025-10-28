/* global describe, it, expect, beforeEach, jest */

// ⚠️ Mock d’abord
jest.mock('../invoiceMail.service', () => ({
  sendInvoiceMail: jest.fn(),
}));

const { sendInvoiceMail: sendInvoiceMailController } = require('../invoiceMail.controller');
const { sendInvoiceMail } = require('../invoiceMail.service');

describe('invoiceMail.controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: '1' },
      body: {
        message: 'Hello',
        subject: 'Facture',
        to: 'client@test.com',
      },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('renvoie success si envoi OK', async () => {
    const fakeInfo = { messageId: '123' };
    sendInvoiceMail.mockResolvedValue(fakeInfo);

    await sendInvoiceMailController(req, res);

    expect(sendInvoiceMail).toHaveBeenCalledWith(
      '1',
      'Hello',
      'Facture',
      'client@test.com'
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Facture envoyée par mail',
      info: fakeInfo,
    });
  });

  it('renvoie erreur 500 si envoi échoue', async () => {
    sendInvoiceMail.mockRejectedValue(new Error('SMTP fail'));

    await sendInvoiceMailController(req, res);

    expect(sendInvoiceMail).toHaveBeenCalledWith(
      '1',
      'Hello',
      'Facture',
      'client@test.com'
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'SMTP fail',
    });
  });
});
