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
}

module.exports = StorageService;
