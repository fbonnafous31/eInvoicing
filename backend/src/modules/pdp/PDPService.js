// src/modules/pdp/PDPService.js
const PDPInterface = require('./PDPInterface');
const IopoleAdapter = require('./adapters/IopoleAdapter');
const MockPDPAdapter = require('./adapters/MockPDPAdapter');

class PDPService {
  constructor(adapterName = 'mock') {
    switch (adapterName) {
      case 'iopole':
        this.adapter = new IopoleAdapter();
        break;
      case 'mock':
      default:
        this.adapter = new MockPDPAdapter();
        break;
    }

    if (!(this.adapter instanceof PDPInterface)) {
      throw new Error('Adapter PDP invalide, doit implémenter PDPInterface');
    }
  }

  async sendInvoice(payload) {
    return this.adapter.sendInvoice(payload);
  }

  async sendStatus(invoicePdpId, payload) {
    return this.adapter.sendStatus(invoicePdpId, payload);
  }

  async fetchStatusHistory(invoicePdpId) {
    return this.adapter.fetchStatusHistory(invoicePdpId);
  }
}

module.exports = PDPService;
