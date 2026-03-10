// src/modules/pdp/adapters/SuperPDPAdapter.js
const axios = require('axios');
const { URLSearchParams } = require('url');
const fs = require('fs');
const PDPInterface = require('../PDPInterface.js');
const logger = require('../../../utils/logger');

class SuperPDPAdapter extends PDPInterface {
  constructor({ baseURL }) {
    super();

    if (!baseURL) throw new Error('SuperPDPAdapter requires baseURL');

    this.baseURL = baseURL;
    this.authURL = process.env.SUPERPDP_AUTH_URL;

    this.clientId = process.env.SUPERPDP_CLIENT_ID;
    this.clientSecret = process.env.SUPERPDP_CLIENT_SECRET;

    this.token = null;
    this.tokenExpiresAt = 0;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  /** Vérifie si le token est encore valide */
  _isTokenValid() {
    return this.token && Date.now() < this.tokenExpiresAt;
  }

  /** Authentification OAuth Client Credentials */
  async _authenticate() {
    try {
      logger.info('[SuperPDPAdapter] 🔐 Récupération token OAuth');

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post(`${this.authURL}/token`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.token = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = Date.now() + (expiresIn - 10) * 1000;

      logger.info('[SuperPDPAdapter] ✅ Token OAuth récupéré');
    } catch (error) {
      logger.error(
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        '[SuperPDPAdapter] ❌ Erreur OAuth'
      );
      throw this._normalizeError(error);
    }
  }

  /** Retourne un header Authorization valide */
  async _getAuthHeaders() {
    if (!this._isTokenValid()) {
      await this._authenticate();
    }
    return { Authorization: `Bearer ${this.token}` };
  }

  /** Envoi d’une facture */
  async sendInvoice({ invoiceLocalId, filePath }) {
    try {
      logger.info(`[SuperPDP] 🔍 Début de procédure d'envoi XML pour la facture: ${invoiceLocalId}`);

      // 1. Récupération des headers d'authentification
      // Note: Assure-toi que _getAuthHeaders() ne force pas un Content-Type JSON
      const authHeaders = await this._getAuthHeaders();
      
      // 2. Lecture du fichier XML local
      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier XML introuvable sur le disque : ${filePath}`);
      }
      const xmlContent = fs.readFileSync(filePath);

      logger.debug({ 
        filePath, 
        fileSize: xmlContent.length,
        has_token: !!authHeaders.Authorization 
      }, "[SuperPDP] Fichier prêt pour l'envoi binaire");

      // 3. Appel API en mode "Binary Stream"
      // On écrase le Content-Type pour envoyer du XML brut (UBL/CII)
      const url = '/v1.beta/invoices';
      
      const response = await this.client.post(url, xmlContent, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/xml' // Crucial pour que SuperPDP accepte le flux
        }
      });

      logger.info({
        status: response.status,
        pdp_id: response.data?.id,
        company_id: response.data?.company_id
      }, "[SuperPDP] ✅ Facture téléversée avec succès");

      return {
        success: true,
        id: response.data?.id,
        raw: response.data
      };

    } catch (error) {
      const errorDetail = {
        message: error.message,
        status: error.response?.status,
        apiFeedback: error.response?.data, // Contient souvent le pourquoi du rejet
        requestPayloadPreview: "XML Binary Stream"
      };

      logger.error(errorDetail, "[SuperPDP] ❌ Échec de l'envoi");
      
      // En cas d'erreur 400, l'API renvoie parfois un tableau de validation
      if (error.response?.data?.validation_errors) {
        console.error("[SuperPDP] Erreurs de conformité XML :");
        console.table(error.response.data.validation_errors);
      }

      throw error;
    }
  }

  /** Récupère l’historique des statuts */
  async fetchStatusHistory(invoiceId) {
    try {
      const headers = await this._getAuthHeaders();

      let events = [];
      let hasAfter = true;
      let lastId = 0;

      while (hasAfter) {
        const response = await this.client.get('/v1.beta/invoice_events', {
          headers,
          params: { invoice_id: invoiceId, limit: 100, starting_after_id: lastId },
        });

        const pageEvents = response.data.data.map(ev => ({
          statusId: ev.id,
          date: ev.created_at,
          code: ev.status_code,
          label: ev.status_text,
          invoiceId: ev.invoice_id,
          attachments: ev.attachments,
          details: ev.details,
        }));

        if (pageEvents.length) lastId = pageEvents[pageEvents.length - 1].statusId;
        events.push(...pageEvents);

        hasAfter = response.data.has_after;
      }

      logger.info(`[SuperPDPAdapter] ✅ ${events.length} event(s) récupéré(s)`);
      return events;
    } catch (error) {
      logger.error(
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        '[SuperPDPAdapter] ❌ Erreur fetchStatusHistory'
      );
      throw this._normalizeError(error);
    }
  }

  /** Création d'un event / statut */
  async sendStatus(invoicePdpId, payload) {
    try {
      const headers = await this._getAuthHeaders();

      const eventJson = {
        invoice_id: invoicePdpId,
        status_code: payload.code,
        attachments: payload.attachments || [],
        details: payload.details || [],
      };

      const response = await this.client.post('/v1.beta/invoice_events', eventJson, { headers });

      logger.info(`[SuperPDPAdapter] ✅ Event créé pour invoice ${invoicePdpId}`);
      return { success: true, raw: response.data };
    } catch (error) {
      logger.error(
        {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        '[SuperPDPAdapter] ❌ Erreur sendStatus'
      );
      throw this._normalizeError(error);
    }
  }

  /** Normalisation des erreurs Axios */
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
}

module.exports = SuperPDPAdapter;