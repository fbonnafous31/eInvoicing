// pdp/adapters/IopoleAdapter.js
const axios = require('axios');
const PDPInterface = require('../PDPInterface.js');
const { URLSearchParams } = require('url');
const fs = require('fs');
const FormData = require('form-data');

class IopoleAdapter extends PDPInterface {
  constructor({ baseURL, authURL, clientId, clientSecret }) {
    super();

    if (!baseURL || !authURL || !clientId || !clientSecret) {
      throw new Error('IopoleAdapter requires baseURL, authURL, clientId and clientSecret');
    }

    this.baseURL = baseURL;
    this.authURL = authURL;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = null;
    this.tokenExpiry = null;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  async _getAccessToken() {
    const now = Date.now();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) {
      return this.token;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const { data } = await axios.post(
      `${this.authURL}/realms/iopole/protocol/openid-connect/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    this.token = data.access_token;
    this.tokenExpiry = now + 9 * 60 * 1000;
    return this.token;
  }

  async sendInvoice(payload, { isSandbox = false } = {}) {
    const token = await this._getAccessToken();
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(payload.filePath));

      const response = await this.client.post('/v1/invoice', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      });

      const invoiceId = response.data?.id;
      console.log(`[IopoleAdapter] ✅ Facture envoyée → ID PDP: ${invoiceId}`);

      let status = null;
      if (invoiceId && !isSandbox) {
        try {
          status = await this.fetchStatus(invoiceId);
          console.log(`[IopoleAdapter] 📦 Statut récupéré pour ${invoiceId}:`, status);
        } catch (err) {
          console.warn('[IopoleAdapter] ⚠️ fetchStatus a échoué (sandbox probable):', err.message);
        }
      }

      return {
        success: true,
        type: 'iopole',
        id: invoiceId,
        message: 'Facture envoyée vers la PDP Iopole',
        raw: response.data,
        status,
      };
    } catch (error) {
      console.error('[IopoleAdapter] ❌ Erreur lors de l’envoi:', error.message);
      throw this._normalizeError(error);
    }
  }

  async sendStatus(invoicePdpId, payload) {
    const token = await this._getAccessToken();
    try {
      const response = await this.client.post(
        `/v1/invoice/${invoicePdpId}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[IopoleAdapter] Réponse PDP pour invoice ${invoicePdpId}:`, response.data);
      return { success: true, message: response.data?.message || null };
    } catch (error) {
      console.error('[IopoleAdapter] sendStatus error:', error.message);
      if (error.response) console.error('[IopoleAdapter] Détails réponse PDP:', error.response.data);
      throw this._normalizeError(error);
    }
  }

  _normalizeError(error) {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Erreur PDP distante',
        statusCode: error.response.status,
        details: error.response.data,
      };
    }
    if (error.request) return { message: 'Aucune réponse du PDP distant', statusCode: 504 };
    return { message: error.message, statusCode: 500 };
  }

  async fetchStatus(invoiceId) {
    const token = await this._getAccessToken();
    try {
      const response = await this.client.get(`/v1/invoice/${invoiceId}/status-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const statuses = response.data.map(entry => ({
        statusId: entry.statusId,
        date: entry.date,
        destType: entry.destType,
        code: entry.status?.code || null,
        networkCode: entry.status?.networkCode || null,
        invoiceId: entry.invoiceId,
        xml: entry.xml,
        json: entry.json,
        rejectionReason: entry.json?.responses?.[0]?.rejectionDetail?.reason || null,
        rejectionMessage: entry.json?.responses?.[0]?.rejectionDetail?.message || null,
      }));

      console.log(`[IopoleAdapter] ✅ ${statuses.length} statut(s) récupéré(s) pour ${invoiceId}`);
      statuses.forEach(s => {
        const extra = s.code === 'REJECTED' && s.rejectionMessage ? ` ⚠️ ${s.rejectionReason}: ${s.rejectionMessage}` : '';
        console.log(`   → ${s.date} | ${s.code || 'N/A'} (${s.networkCode || '-'}) via ${s.destType}${extra}`);
      });

      return statuses;
    } catch (err) {
      console.error(`[IopoleAdapter] ❌ Erreur récupération statuts pour ${invoiceId}`);
      console.error(`[IopoleAdapter] → ${err.message}`);
      throw this._normalizeError(err);
    }
  }
}

// ⚠️ Export CommonJS correct
module.exports = IopoleAdapter;
