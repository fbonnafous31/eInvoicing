const StorageService = require('./storage');
const LocalAdapter = require('./adapters/local');

const storageService = new StorageService(new LocalAdapter());

module.exports = storageService;
