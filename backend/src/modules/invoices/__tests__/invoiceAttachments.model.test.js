/* global describe, it, expect, beforeEach */

const fs = require('fs');
const path = require('path');
const db = require('../../../config/db');
const { generateStoredName, getFinalPath } = require('../../../utils/fileNaming');
const {
  saveAttachment,
  getAttachment,
  getAdditionalAttachments,
} = require('../invoiceAttachments.model');

jest.mock('fs');
jest.mock('path');
jest.mock('../../../config/db');
jest.mock('../../../utils/fileNaming', () => ({
  generateStoredName: jest.fn(),
  getFinalPath: jest.fn(),
}));

describe('invoiceAttachments.model', () => {
  const conn = { query: jest.fn() };
  const mockInvoiceId = 123;
  const schema = process.env.DB_SCHEMA || 'public';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.promises = {
      rename: jest.fn(),
      readdir: jest.fn(),
      unlink: jest.fn(),
    };
    path.join.mockImplementation((...args) => args.join('/'));
    path.resolve.mockImplementation((p) => `/abs/${p}`);
  });

  it('✅ saveAttachment déplace le fichier et insère en DB', async () => {
    generateStoredName.mockReturnValue('123_main_file.pdf');
    getFinalPath.mockReturnValue('/uploads/123_main_file.pdf');
    conn.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const att = { file_name: 'file.pdf', file_path: '/tmp/file.pdf', attachment_type: 'main' };
    const result = await saveAttachment(conn, mockInvoiceId, att);

    expect(fs.promises.rename).toHaveBeenCalledWith('/tmp/file.pdf', '/uploads/123_main_file.pdf');
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining(`INSERT INTO ${schema}.invoice_attachments`),
      [123, 'file.pdf', '/uploads/123_main_file.pdf', '123_main_file.pdf', 'main']
    );
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
    path.resolve.mockImplementation((p) => `/abs/${p}`);

    const result = await getAdditionalAttachments(123);

    expect(result).toEqual([
      { file_name: 'a.pdf', file_path: '/abs/a.pdf' },
      { file_name: 'b.pdf', file_path: '/abs/b.pdf' },
    ]);
  });
});
