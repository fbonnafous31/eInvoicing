const fs = require('fs');
const path = require('path');

class LocalAdapter {
  constructor(basePath) {
    this.basePath = basePath || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(this.basePath)) fs.mkdirSync(this.basePath, { recursive: true });
  }

  async save(fileBuffer, fileName) {
    const filePath = path.join(this.basePath, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    return filePath;
  }

  async get(fileName) {
    const filePath = path.join(this.basePath, fileName);
    return fs.readFileSync(filePath);
  }

  async delete(fileName) {
    const filePath = path.join(this.basePath, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = LocalAdapter;
