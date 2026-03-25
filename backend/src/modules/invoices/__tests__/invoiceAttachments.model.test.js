/* global describe, it, expect, beforeEach */
const fs = require('fs');
const db = require('../../../config/db');
const storageService = require('../../../services');

jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    relative: jest.fn().mockReturnValue('/123_main_file.pdf'),
  };
});

jest.mock('../../../config/db');
jest.mock('../../../utils/fileNaming', () => ({
  generateStoredName: jest.fn(),
  getFinalPath: jest.fn(),
}));
jest.mock('../../../services');

const { generateStoredName, getFinalPath } = require('../../../utils/fileNaming');
const {
  saveAttachment,
  cleanupAttachments,
  getAttachment,
  getAdditionalAttachments,
} = require('../invoiceAttachments.model');

const schema = process.env.DB_SCHEMA || 'public';

describe('invoiceAttachments.model', () => {
  const conn = { query: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    fs.promises.rename = jest.fn().mockResolvedValue();
    fs.promises.readdir = jest.fn().mockResolvedValue([]);
    fs.promises.unlink = jest.fn().mockResolvedValue();
    fs.promises.readFile = jest.fn().mockResolvedValue(Buffer.from('dummy'));
    storageService.save = jest.fn().mockResolvedValue();
    storageService.list = jest.fn().mockResolvedValue([]);
    storageService.delete = jest.fn().mockResolvedValue();
  });

  // ------------------- saveAttachment -------------------

  describe('saveAttachment', () => {
    it('déplace le fichier et insère en DB', async () => {
      generateStoredName.mockReturnValue('123_main_file.pdf');
      getFinalPath.mockReturnValue('/uploads/123_main_file.pdf');
      conn.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const att = { file_name: 'file.pdf', file_path: '/tmp/file.pdf', attachment_type: 'main' };
      const result = await saveAttachment(conn, 123, att);

      expect(fs.promises.rename).toHaveBeenCalledWith('/tmp/file.pdf', '/uploads/123_main_file.pdf');
      expect(fs.promises.readFile).toHaveBeenCalledWith('/uploads/123_main_file.pdf');
      expect(storageService.save).toHaveBeenCalledWith(expect.any(Buffer), '/123_main_file.pdf');
      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining(`INSERT INTO ${schema}.invoice_attachments`),
        [123, 'file.pdf', '/123_main_file.pdf', '123_main_file.pdf', 'main']
      );
      expect(result).toEqual({ id: 1 });
    });

    it('déduit attachment_type depuis isMain si absent', async () => {
      generateStoredName.mockReturnValue('123_main_inferred.pdf');
      getFinalPath.mockReturnValue('/uploads/123_main_inferred.pdf');
      conn.query.mockResolvedValue({ rows: [{ id: 2 }] });

      const att = { file_name: 'file.pdf', file_path: '/tmp/file.pdf', isMain: true };
      const result = await saveAttachment(conn, 123, att);

      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining(['main'])
      );
      expect(result).toEqual({ id: 2 });
    });

    it('déduit attachment_type à additional si isMain est false', async () => {
      generateStoredName.mockReturnValue('123_additional_file.pdf');
      getFinalPath.mockReturnValue('/uploads/123_additional_file.pdf');
      conn.query.mockResolvedValue({ rows: [{ id: 3 }] });

      const att = { file_name: 'file.pdf', file_path: '/tmp/file.pdf', isMain: false };
      await saveAttachment(conn, 123, att);

      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining(['additional'])
      );
    });
  });

  // ------------------- cleanupAttachments -------------------

  describe('cleanupAttachments', () => {
    beforeEach(() => {
      getFinalPath.mockReturnValue('/uploads/invoices/');
    });

    it('supprime les fichiers orphelins non référencés en DB', async () => {
      conn.query.mockResolvedValue({
        rows: [{ stored_name: '123_main_file.pdf' }],
      });
      storageService.list.mockResolvedValue([
        '123_main_file.pdf',
        '123_old_orphan.pdf',
      ]);

      await cleanupAttachments(conn, 123);

      expect(storageService.delete).toHaveBeenCalledTimes(1);
      expect(storageService.delete).toHaveBeenCalledWith(
        expect.stringContaining('123_old_orphan.pdf')
      );
      expect(storageService.delete).not.toHaveBeenCalledWith(
        expect.stringContaining('123_main_file.pdf')
      );
    });

    it('ne supprime pas les fichiers appartenant à une autre facture', async () => {
      conn.query.mockResolvedValue({ rows: [] });
      storageService.list.mockResolvedValue(['456_other_invoice.pdf']);

      await cleanupAttachments(conn, 123);

      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('ne supprime rien si aucun fichier orphelin', async () => {
      conn.query.mockResolvedValue({
        rows: [{ stored_name: '123_main_file.pdf' }],
      });
      storageService.list.mockResolvedValue(['123_main_file.pdf']);

      await cleanupAttachments(conn, 123);

      expect(storageService.delete).not.toHaveBeenCalled();
    });
  });

  // ------------------- getAttachment -------------------

  describe('getAttachment', () => {
    it('retourne la pièce jointe si trouvée', async () => {
      db.query.mockResolvedValue({
        rows: [{ file_name: 'f.pdf', file_path: '/path/f.pdf' }],
      });

      const result = await getAttachment(123, 'main');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining(`FROM ${schema}.invoice_attachments`),
        [123, 'main']
      );
      expect(result).toEqual({ file_name: 'f.pdf', file_path: '/path/f.pdf' });
    });

    it('retourne null si aucune pièce jointe', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await getAttachment(123, 'main');

      expect(result).toBeNull();
    });
  });

  // ------------------- getAdditionalAttachments -------------------

  describe('getAdditionalAttachments', () => {
    it('retourne les pièces avec chemin absolu résolu', async () => {
      db.query.mockResolvedValue({
        rows: [
          { file_name: 'a.pdf', file_path: 'a.pdf' },
          { file_name: 'b.pdf', file_path: 'b.pdf' },
        ],
      });

      const pathActual = jest.requireActual('path');
      const result = await getAdditionalAttachments(123);

      expect(result).toEqual([
        { file_name: 'a.pdf', file_path: pathActual.resolve('a.pdf') },
        { file_name: 'b.pdf', file_path: pathActual.resolve('b.pdf') },
      ]);
    });

    it('retourne un tableau vide si aucune pièce jointe', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await getAdditionalAttachments(123);

      expect(result).toEqual([]);
    });
  });
});