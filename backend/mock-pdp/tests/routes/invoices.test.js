/* global describe, it, expect, beforeEach, beforeAll, afterAll */

const invoicesRouter = require('../../routes/invoices');
const { submissions, createSubmission } = require('../../services/submissions');

// Mocks pour req, res
function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

// Mock console.log pour éviter le spam
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
});

// Réinitialisation des submissions avant chaque test
beforeEach(() => {
  for (const key in submissions) delete submissions[key];
});

describe('Invoices Routes (unit tests)', () => {

  it('POST /:id/send crée une submission', () => {
    const req = { params: { id: 'inv-123' } };
    const res = createMockRes();

    const handler = invoicesRouter.stack.find(layer =>
      layer.route && layer.route.path === '/:id/send'
    ).route.stack[0].handle;

    handler(req, res);

    const subId = Object.keys(submissions)[0];
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceId: 'inv-123', submissionId: subId })
    );
    expect(submissions[subId]).toBeDefined();
  });

  it('GET /:submissionId/status retourne le status', () => {
    const subId = 'sub-1';
    createSubmission(subId, { invoiceId: 'inv-1', technicalStatus: 'received' });

    const req = { params: { submissionId: subId } };
    const res = createMockRes();

    const handler = invoicesRouter.stack.find(layer =>
      layer.route && layer.route.path === '/:submissionId/status'
    ).route.stack[0].handle;

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ invoiceId: 'inv-1', technicalStatus: 'received' });
  });

  it('GET /:submissionId/status retourne 404 si submission non trouvée', () => {
    const req = { params: { submissionId: 'unknown' } };
    const res = createMockRes();

    const handler = invoicesRouter.stack.find(layer =>
      layer.route && layer.route.path === '/:submissionId/status'
    ).route.stack[0].handle;

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Submission non trouvée' });
  });

  it('POST /:submissionId/lifecycle/request avance le cycle métier', () => {
    const subId = 'sub-2';
    createSubmission(subId, {
      invoiceId: 'inv-2',
      technicalStatus: 'received',
      lifecycle: [{ code: 202, label: 'Créée', createdAt: new Date().toISOString() }]
    });

    const req = { params: { submissionId: subId } };
    const res = createMockRes();

    const handler = invoicesRouter.stack.find(layer =>
      layer.route && layer.route.path === '/:submissionId/lifecycle/request'
    ).route.stack[0].handle;

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: 'inv-2' }));
    expect(submissions[subId].lifecycle.length).toBeGreaterThan(0);
  });

  it('GET /:submissionId/lifecycle retourne la lifecycle', () => {
    const subId = 'sub-3';
    createSubmission(subId, {
      invoiceId: 'inv-3',
      technicalStatus: 'received',
      lifecycle: [{ code: 202, label: 'Créée', createdAt: new Date().toISOString() }]
    });

    const req = { params: { submissionId: subId } };
    const res = createMockRes();

    const handler = invoicesRouter.stack.find(layer =>
      layer.route && layer.route.path === '/:submissionId/lifecycle'
    ).route.stack[0].handle;

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceId: 'inv-3', lifecycle: expect.any(Array) })
    );
  });

});
