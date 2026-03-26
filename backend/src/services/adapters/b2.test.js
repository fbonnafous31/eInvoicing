/* global describe, it, expect, beforeEach */

const { mockClient } = require('aws-sdk-client-mock');
require('aws-sdk-client-mock-jest');

const { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command 
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const B2Adapter = require('./b2');

// Mock du presigner car il n'est pas une commande du S3Client
jest.mock("@aws-sdk/s3-request-presigner");

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
    adapter = new B2Adapter(config);
  });

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
  });

  describe('list()', () => {
    it('devrait retourner une liste de clés vide si le bucket est vide', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });
      const files = await adapter.list();
      expect(files).toEqual([]);
    });

    it('devrait extraire uniquement les clés (Key) des fichiers', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'img1.jpg' }, { Key: 'img2.jpg' }]
      });

      const files = await adapter.list('images/');
      expect(files).toEqual(['img1.jpg', 'img2.jpg']);
    });
  });

  describe('delete()', () => {
    it('devrait appeler DeleteObjectCommand avec les bons paramètres', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});
      await adapter.delete('to-delete.png');
      
      expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
        Bucket: config.bucketName,
        Key: 'to-delete.png'
      });
    });
  });

  describe('getPublicUrl()', () => {
    it('devrait retourner null si aucun nom de fichier n\'est fourni', async () => {
      const url = await adapter.getPublicUrl(null);
      expect(url).toBeNull();
    });

    it('devrait appeler getSignedUrl avec les bons paramètres', async () => {
      getSignedUrl.mockResolvedValue('https://signed-url.com');
      
      const url = await adapter.getPublicUrl('photo.jpg', 300);
      
      expect(url).toBe('https://signed-url.com');
      expect(getSignedUrl).toHaveBeenCalled();
    });
  });
});