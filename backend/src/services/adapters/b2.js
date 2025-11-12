// backend/src/services/adapters/b2.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { buffer } = require('stream/consumers');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

class B2Adapter {
  constructor({ endpoint, bucketName, keyID, applicationKey }) {
    this.s3 = new S3Client({
      region: "us-east-005",
      endpoint,
      credentials: { accessKeyId: keyID, secretAccessKey: applicationKey },
    });
    this.bucketName = bucketName;
  }

  async save(buffer, fileName) {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: buffer,
    }));
    return fileName;
  }

  async get(fileName) {
    const res = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    }));
    
    // Convertit le Readable stream en Buffer
    const data = await buffer(res.Body);
    return data;
  }

  async delete(fileName) {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    }));
  }

  async list(prefix = '') {
    const res = await this.s3.send(new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    }));
    return res.Contents ? res.Contents.map(f => f.Key) : [];
  }

  async getPublicUrl(fileName, expiresInSeconds = 60 * 5) {
    if (!fileName) return null;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });

    // Génère une URL signée valable 5 minutes
    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
    return signedUrl;
  }  
}

module.exports = B2Adapter; 
