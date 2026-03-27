/* global describe, it, expect, beforeEach, jest */

const StorageService = require('../storage');

describe('StorageService', () => {
  let mockAdapter;
  let service;

  beforeEach(() => {
    mockAdapter = {
      save: jest.fn().mockResolvedValue('saved'),
      get: jest.fn().mockResolvedValue('content'),
      delete: jest.fn().mockResolvedValue(true),
      list: jest.fn().mockResolvedValue(['file1']),
    };

    service = new StorageService(mockAdapter);
  });

  // ─────────────────────────────────────────────
  // Délégation simple
  // ─────────────────────────────────────────────

  it('délègue save() à l’adapter', async () => {
    const result = await service.save('buffer', 'file.txt');

    expect(mockAdapter.save).toHaveBeenCalledWith('buffer', 'file.txt');
    expect(result).toBe('saved');
  });

  it('délègue get() à l’adapter', async () => {
    const result = await service.get('file.txt');

    expect(mockAdapter.get).toHaveBeenCalledWith('file.txt');
    expect(result).toBe('content');
  });

  it('délègue delete() à l’adapter', async () => {
    const result = await service.delete('file.txt');

    expect(mockAdapter.delete).toHaveBeenCalledWith('file.txt');
    expect(result).toBe(true);
  });

  // ─────────────────────────────────────────────
  // list()
  // ─────────────────────────────────────────────

  it('délègue list() à l’adapter si disponible', async () => {
    const result = await service.list('folder');

    expect(mockAdapter.list).toHaveBeenCalledWith('folder');
    expect(result).toEqual(['file1']);
  });

  it('lève une erreur si list() non implémentée', async () => {
    delete mockAdapter.list;
    service = new StorageService(mockAdapter);

    await expect(service.list('folder')).rejects.toThrow(
      'Adapter does not implement list()'
    );
  });

  // ─────────────────────────────────────────────
  // getPublicUrl()
  // ─────────────────────────────────────────────

  it('délègue getPublicUrl() à l’adapter si disponible', async () => {
    mockAdapter.getPublicUrl = jest.fn().mockResolvedValue('https://file.url');

    const result = await service.getPublicUrl('file.txt');

    expect(mockAdapter.getPublicUrl).toHaveBeenCalledWith('file.txt');
    expect(result).toBe('https://file.url');
  });

  it('lève une erreur si getPublicUrl() non implémentée', async () => {
    await expect(service.getPublicUrl('file.txt')).rejects.toThrow(
      'Adapter does not implement getPublicUrl()'
    );
  });

  // ─────────────────────────────────────────────
  // getFileStream()
  // ─────────────────────────────────────────────

  it('délègue getFileStream() à l’adapter si disponible', async () => {
    const fakeStream = { stream: true };
    mockAdapter.getFileStream = jest.fn().mockResolvedValue(fakeStream);

    const result = await service.getFileStream('file.txt');

    expect(mockAdapter.getFileStream).toHaveBeenCalledWith('file.txt');
    expect(result).toBe(fakeStream);
  });

  it('lève une erreur si getFileStream() non implémentée', async () => {
    await expect(service.getFileStream('file.txt')).rejects.toThrow(
      'Adapter does not implement getFileStream()'
    );
  });
});