/* global describe, it, expect, beforeEach */

const { mockClient } = require('aws-sdk-client-mock');
require('aws-sdk-client-mock-jest');

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const B2Adapter = require('../adapters/b2');

// Mock du presigner
jest.mock('@aws-sdk/s3-request-presigner');

describe('B2Adapter', () => {
  const s3Mock = mockClient(S3Client);

  const config = {
    endpoint: 's3.us-east-005.backblazeb2.com',
    bucketName: 'test-bucket',
    keyID: 'key-id',
    applicationKey: 'app-key'
  };

  let adapter;

  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
    adapter = new B2Adapter(config);
  });

  // ─────────────────────────────────────────────
  // save()
  // ─────────────────────────────────────────────

  describe('save()', () => {
    it('devrait envoyer le fichier au bucket et retourner le nom du fichier', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const result = await adapter.save(Buffer.from('hello'), 'test.txt');

      expect(result).toBe('test.txt');
      expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
        Bucket: config.bucketName,
        Key: 'test.txt',
        Body: Buffer.from('hello')
      });
    });

    it('devrait propager une erreur si l’upload échoue', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 error'));

      await expect(
        adapter.save(Buffer.from('hello'), 'test.txt')
      ).rejects.toThrow('S3 error');
    });
  });

  // ─────────────────────────────────────────────
  // list()
  // ─────────────────────────────────────────────

  describe('list()', () => {
    it('devrait retourner une liste vide si le bucket est vide', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      const files = await adapter.list();

      expect(files).toEqual([]);
    });

    it('devrait retourner une liste vide si Contents est undefined', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({});

      const files = await adapter.list();

      expect(files).toEqual([]);
    });

    it('devrait extraire uniquement les clés des fichiers', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'img1.jpg' }, { Key: 'img2.jpg' }]
      });

      const files = await adapter.list('images/');

      expect(files).toEqual(['img1.jpg', 'img2.jpg']);

      expect(s3Mock).toHaveReceivedCommandWith(ListObjectsV2Command, {
        Bucket: config.bucketName,
        Prefix: 'images/'
      });
    });

    it('devrait propager une erreur si S3 échoue', async () => {
      s3Mock.on(ListObjectsV2Command).rejects(new Error('S3 error'));

      await expect(adapter.list()).rejects.toThrow('S3 error');
    });
  });

  // ─────────────────────────────────────────────
  // delete()
  // ─────────────────────────────────────────────

  describe('delete()', () => {
    it('devrait appeler DeleteObjectCommand avec les bons paramètres', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await adapter.delete('to-delete.png');

      expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
        Bucket: config.bucketName,
        Key: 'to-delete.png'
      });
    });

    it('devrait propager une erreur si la suppression échoue', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(new Error('Delete failed'));

      await expect(adapter.delete('file.png')).rejects.toThrow('Delete failed');
    });
  });

  // ─────────────────────────────────────────────
  // getPublicUrl()
  // ─────────────────────────────────────────────

  describe('getPublicUrl()', () => {
    it("devrait retourner null si aucun nom de fichier n'est fourni", async () => {
      const url = await adapter.getPublicUrl(null);

      expect(url).toBeNull();
    });

    it('devrait appeler getSignedUrl et retourner une URL signée', async () => {
      getSignedUrl.mockResolvedValue('https://signed-url.com');

      const url = await adapter.getPublicUrl('photo.jpg', 300);

      expect(url).toBe('https://signed-url.com');
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('devrait propager une erreur si le presigner échoue', async () => {
      getSignedUrl.mockRejectedValue(new Error('Presign error'));

      await expect(
        adapter.getPublicUrl('photo.jpg')
      ).rejects.toThrow('Presign error');
    });

    it('propagate l’erreur si s3.send échoue', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Get failed'));
      await expect(adapter.get('file.txt')).rejects.toThrow('Get failed');
    });
  });

  // ─────────────────────────────────────────────
  // getFileStream()
  // ─────────────────────────────────────────────
  describe('getFileStream()', () => {
    it('retourne null si fileName est null', async () => {
      const stream = await adapter.getFileStream(null);
      expect(stream).toBeNull();
    });

    it('propagate l’erreur si s3.send échoue', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Stream failed'));
      await expect(adapter.getFileStream('file.txt')).rejects.toThrow('Stream failed');
    });
  });  
});