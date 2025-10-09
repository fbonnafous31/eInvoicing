// pdp/PDPService.js
const PDPInterface = require('./PDPInterface');
const IopoleAdapter = require('./adapters/IopoleAdapter').default;
const MockPDPAdapter = require('./adapters/MockPDPAdapter').default;

class PDPService {
  constructor() {
    const adapterName = process.env.PDP_PROVIDER || 'mock';

    switch (adapterName.toLowerCase()) {
      case 'iopole':
        this.adapter = new IopoleAdapter({
          baseURL: process.env.IOPOLE_BASE_URL,
          authURL: process.env.IOPOLE_AUTH_URL,
          clientId: process.env.IOPOLE_CLIENT_ID,
          clientSecret: process.env.IOPOLE_CLIENT_SECRET,
        });
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

  async fetchStatus(invoicePdpId) {
    return this.adapter.fetchStatus(invoicePdpId);
  }

  async sendStatus(invoicePdpId, payload) {
    return this.adapter.sendStatus(invoicePdpId, payload);
  }
}

module.exports = PDPService;
