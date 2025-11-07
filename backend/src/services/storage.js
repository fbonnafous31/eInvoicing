const fs = require('fs');
const path = require('path');

class StorageService {
  constructor(adapter) {
    this.adapter = adapter; // ex: LocalAdapter, S3Adapter
  }

  async save(fileBuffer, fileName) {
    return this.adapter.save(fileBuffer, fileName);
  }

  async get(fileName) {
    return this.adapter.get(fileName);
  }

  async delete(fileName) {
    return this.adapter.delete(fileName);
  }

    async list(dir = '') {
    if (typeof this.adapter.list !== 'function') {
      throw new Error('Adapter does not implement list()');
    }
    return this.adapter.list(dir);
  }
}

module.exports = StorageService;
