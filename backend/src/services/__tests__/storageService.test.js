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

  it('délègue list() à l’adapter si disponible', async () => {
    const result = await service.list('folder');
    expect(mockAdapter.list).toHaveBeenCalledWith('folder');
    expect(result).toEqual(['file1']);
  });

  it('lève une erreur si list() non implémentée', async () => {
    delete mockAdapter.list;
    service = new StorageService(mockAdapter);
    await expect(service.list('folder')).rejects.toThrow('Adapter does not implement list()');
  });
});
