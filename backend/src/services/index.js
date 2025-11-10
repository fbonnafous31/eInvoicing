// backend/src/services/storage/index.js
const StorageService = require('./storage');
const LocalAdapter = require('./adapters/local');
const B2Adapter = require('./adapters/b2');

let adapter;

switch (process.env.STORAGE_BACKEND) {
  case 'b2':
    adapter = new B2Adapter({
      endpoint: process.env.B2_ENDPOINT,
      bucketName: process.env.B2_BUCKET_NAME,
      keyID: process.env.B2_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY,
    });
    break;
  case 'local':
  default:
    adapter = new LocalAdapter();
    break;
}

const storageService = new StorageService(adapter);

module.exports = storageService;
