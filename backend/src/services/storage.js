class StorageService {
  constructor(adapter) {
    this.adapter = adapter; 
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
  
  async getPublicUrl(relativePath) {
    if (typeof this.adapter.getPublicUrl !== 'function') {
      throw new Error('Adapter does not implement getPublicUrl()');
    }
    return this.adapter.getPublicUrl(relativePath);
  }  
}

module.exports = StorageService;
