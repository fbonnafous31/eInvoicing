/* global describe, it, expect, beforeEach */

const request = require('supertest');
const express = require('express');
const { Readable } = require('stream');

const router = require('../pdfProxy.route');
const { s3Client } = require('../../../../config/s3Client');

jest.mock('../../../../config/s3Client', () => ({
  s3Client: {
    send: jest.fn()
  }
}));

describe('PDF proxy route', () => {
  let app;

  beforeEach(() => {
    app = express();

    // mock logger sinon req.log va planter
    app.use((req, res, next) => {
      req.log = {
        info: jest.fn(),
        error: jest.fn()
      };
      next();
    });

    app.use('/', router);
    jest.clearAllMocks();
  });

  it('retourne 400 si clé invalide', async () => {
    const res = await request(app).get('/..%2Fsecret.pdf'); // 👈 encodé

    expect(res.status).toBe(400);
    expect(res.text).toBe('Clé invalide');
  });

  it('stream un PDF avec les bons headers', async () => {
    // Simule le flux PDF
    const mockStream = Readable.from(['PDF_CONTENT']);

    s3Client.send.mockResolvedValue({
      ContentType: 'application/pdf',
      Body: mockStream
    });

    // On bufferise la réponse pour lire le contenu
    const res = await request(app)
      .get('/factures/test.pdf')
      .buffer(); // 👈 important pour transformer le stream en Buffer

    // Vérifie le status et les headers
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('test.pdf');

    // Vérifie le contenu du PDF
    expect(res.body.toString()).toBe('PDF_CONTENT'); 
  });

  it('utilise application/pdf par défaut si ContentType absent', async () => {
    const mockStream = Readable.from(['DATA']);

    s3Client.send.mockResolvedValue({
      Body: mockStream
    });

    const res = await request(app).get('/file.pdf');

    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('retourne 404 si erreur S3', async () => {
    s3Client.send.mockRejectedValue(new Error('Not found'));

    const res = await request(app).get('/missing.pdf');

    expect(res.status).toBe(404);
    expect(res.text).toBe('PDF introuvable');
  });
});