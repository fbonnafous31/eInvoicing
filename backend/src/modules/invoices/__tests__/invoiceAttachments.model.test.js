/* global describe, it, expect, beforeEach */

const fs = require('fs');
const db = require('../../../config/db');
const storageService = require('../../../services');

// Mock partiel de path pour ne mocker que ce qu'on veut
jest.mock('path', () => {
  const actualPath = jest.requireActual('path'); // ✅ doit être à l'intérieur
  return {
    ...actualPath,
    relative: jest.fn().mockReturnValue('/123_main_file.pdf'), // mock pour relativePath
  };
});

const { generateStoredName, getFinalPath } = require('../../../utils/fileNaming');
const {
  saveAttachment,
  getAttachment,
  getAdditionalAttachments,
} = require('../invoiceAttachments.model');

jest.mock('../../../config/db');
jest.mock('../../../utils/fileNaming', () => ({
  generateStoredName: jest.fn(),
  getFinalPath: jest.fn(),
}));
jest.mock('../../../services'); // Mock du storageService

describe('invoiceAttachments.model', () => {
  const conn = { query: jest.fn() };
  const mockInvoiceId = 123;
  const schema = process.env.DB_SCHEMA || 'public';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mocks fs.promises
    fs.promises.rename = jest.fn().mockResolvedValue();
    fs.promises.readdir = jest.fn().mockResolvedValue([]);
    fs.promises.unlink = jest.fn().mockResolvedValue();
    fs.promises.readFile = jest.fn().mockResolvedValue(Buffer.from('dummy')); // <-- important

    // Mock storageService
    storageService.save = jest.fn().mockResolvedValue();
  });

  it('✅ saveAttachment déplace le fichier et insère en DB', async () => {
    generateStoredName.mockReturnValue('123_main_file.pdf');
    getFinalPath.mockReturnValue('/uploads/123_main_file.pdf');
    conn.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const att = { file_name: 'file.pdf', file_path: '/tmp/file.pdf', attachment_type: 'main' };
    const result = await saveAttachment(conn, mockInvoiceId, att);

    // Vérification déplacement fichier
    expect(fs.promises.rename).toHaveBeenCalledWith('/tmp/file.pdf', '/uploads/123_main_file.pdf');

    // Vérification lecture du fichier
    expect(fs.promises.readFile).toHaveBeenCalledWith('/uploads/123_main_file.pdf');

    // Vérification storageService
    expect(storageService.save).toHaveBeenCalledWith(expect.any(Buffer), '/123_main_file.pdf');

    // Vérification insertion en DB
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining(`INSERT INTO ${schema}.invoice_attachments`),
      [123, 'file.pdf', '/123_main_file.pdf', '123_main_file.pdf', 'main']
    );

    // Vérification du résultat retourné
    expect(result).toEqual({ id: 1 });
  });

  it('📄 getAttachment retourne la première pièce jointe', async () => {
    db.query.mockResolvedValue({ rows: [{ file_name: 'f.pdf', file_path: '/path/f.pdf' }] });

    const result = await getAttachment(123, 'main');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(`FROM ${schema}.invoice_attachments`),
      [123, 'main']
    );
    expect(result).toEqual({ file_name: 'f.pdf', file_path: '/path/f.pdf' });
  });

  it('📁 getAdditionalAttachments retourne les pièces avec chemin absolu', async () => {
    db.query.mockResolvedValue({
      rows: [
        { file_name: 'a.pdf', file_path: 'a.pdf' },
        { file_name: 'b.pdf', file_path: 'b.pdf' },
      ],
    });

    const path = require('path'); // utilise le vrai path
    const result = await getAdditionalAttachments(123);

    expect(result).toEqual([
      { file_name: 'a.pdf', file_path: path.resolve('a.pdf') },
      { file_name: 'b.pdf', file_path: path.resolve('b.pdf') },
    ]);
  });
});
