const fs = require('fs/promises');
const path = require('path');

class LocalAdapter {
  constructor() {
    this.basePath = path.join(__dirname, '../../../src/uploads');

    // Création des répertoires standards
    fs.mkdir(path.join(this.basePath, 'factur-x'), { recursive: true }).catch(() => {});
    fs.mkdir(path.join(this.basePath, 'invoices'), { recursive: true }).catch(() => {});
    fs.mkdir(path.join(this.basePath, 'pdf-a3'), { recursive: true }).catch(() => {});
  }

  async save(buffer, relativePath) {
    const filePath = path.join(this.basePath, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async get(relativePath) {
    const filePath = path.join(this.basePath, relativePath);
    return await fs.readFile(filePath);
  }

  async delete(relativePath) {
    const filePath = path.join(this.basePath, relativePath);
    await fs.unlink(filePath).catch(() => {});
  }

  async list(relativeDir = '') {
    const dirPath = path.join(this.basePath, relativeDir);
    try {
      const files = await fs.readdir(dirPath);
      return files;
    } catch (err) {
      console.log(err);
      return []; 
    }
  }
}

module.exports = LocalAdapter;
