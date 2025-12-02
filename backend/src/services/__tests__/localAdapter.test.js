/* global describe, it, expect, beforeEach, jest */

const fs = require('fs/promises');
const path = require('path');
const LocalAdapter = require('../adapters/local');

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(),
  writeFile: jest.fn().mockResolvedValue(),
  readFile: jest.fn().mockResolvedValue(Buffer.from('content')),
  unlink: jest.fn().mockResolvedValue(),
  readdir: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(), 
}));

describe('LocalAdapter', () => {
  let adapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // maintenant que mkdir est mocké, on peut créer l'instance
    adapter = new LocalAdapter();
  });

  it('✅ crée les dossiers standards à l\'initialisation', () => {
    expect(fs.mkdir).toHaveBeenCalledWith(path.join(adapter.basePath, 'factur-x'), { recursive: true });
    expect(fs.mkdir).toHaveBeenCalledWith(path.join(adapter.basePath, 'invoices'), { recursive: true });
    expect(fs.mkdir).toHaveBeenCalledWith(path.join(adapter.basePath, 'pdf-a3'), { recursive: true });
  });

  it('✅ save() écrit le fichier et crée le dossier parent', async () => {
    const buffer = Buffer.from('test');
    const relativePath = 'factur-x/123.xml';
    const result = await adapter.save(buffer, relativePath);

    expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(path.join(adapter.basePath, relativePath)), { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(path.join(adapter.basePath, relativePath), buffer);
    expect(result).toBe(path.join(adapter.basePath, relativePath));
  });

  it('✅ get() lit correctement le fichier', async () => {
    const result = await adapter.get('factur-x/123.xml');
    expect(fs.readFile).toHaveBeenCalledWith(path.join(adapter.basePath, 'factur-x/123.xml'));
    expect(result.toString()).toBe('content');
  });

  it('✅ delete() supprime le fichier et ne plante pas si le fichier n\'existe pas', async () => {
    await expect(adapter.delete('factur-x/123.xml')).resolves.not.toThrow();

    fs.unlink.mockRejectedValueOnce(new Error('Not found'));
    await expect(adapter.delete('factur-x/999.xml')).resolves.not.toThrow();
  });

  it('✅ list() retourne les fichiers du répertoire ou [] si inexistant', async () => {
    fs.readdir.mockResolvedValueOnce(['a.pdf', 'b.pdf']);
    let files = await adapter.list('pdf-a3');
    expect(files).toEqual(['a.pdf', 'b.pdf']);

    fs.readdir.mockRejectedValueOnce(new Error('Not found'));
    files = await adapter.list('unknown');
    expect(files).toEqual([]);
  });
});
