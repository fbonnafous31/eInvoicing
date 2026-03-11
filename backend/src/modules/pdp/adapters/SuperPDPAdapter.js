// src/modules/pdp/adapters/SuperPDPAdapter.js
const axios = require('axios');
const { URLSearchParams } = require('url');
const fs = require('fs');
const PDPInterface = require('../PDPInterface.js');
const logger = require('../../../utils/logger');
const InvoiceStatusModel = require('../../invoices/invoiceStatus.model');

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
    logger.info('[SuperPDPAdapter] 🔐 Récupération token OAuth');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.post(`${this.authURL}/token`, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        this.token = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiresAt = Date.now() + (expiresIn - 10) * 1000;

        logger.info('[SuperPDPAdapter] ✅ Token OAuth récupéré');
        return;
      } catch (error) {
        if (attempt === 3) {
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

        await new Promise(r => setTimeout(r, 500));
      }
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
      const authHeaders = await this._getAuthHeaders();
      
      // 2. Lecture du fichier XML local
      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier XML introuvable sur le disque : ${filePath}`);
      }
      const xmlContent = fs.readFileSync(filePath);

      const url = '/v1.beta/invoices';

      logger.info(
        {
          invoiceLocalId,
          filePath,
          fileSize: xmlContent.length,
          endpoint: url
        },
        "[SuperPDP] 📤 Envoi facture"
      );

      // 3. Appel API en mode "Binary Stream"      
      const response = await this.client.post(url, xmlContent, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/xml' 
        }
      });

      logger.info({
        status: response.status,
        pdp_id: response.data?.id,
        company_id: response.data?.company_id
      }, "[SuperPDP] ✅ Facture téléversée avec succès");

      logger.info(
        {
          invoiceLocalId,
          pdpInvoiceId: response.data?.id,
          status: response.status
        },
        "[SuperPDP] 📥 Réponse upload PDP"
      );

      return {
        success: true,
        id: response.data?.id,
        raw: response.data
      };

    } catch (error) {
      const errorDetail = {
        message: error.message,
        status: error.response?.status,
        apiFeedback: error.response?.data, 
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

  /**
   * Récupère l’historique des statuts depuis le PDP et met à jour le dernier statut valide
   * @param {number} submissionId - L'ID de soumission côté PDP
   * @returns {Promise<Array>} - Le dernier event valide (tableau d'un élément) ou [] si aucun
   */
  async fetchStatusHistory(submissionId) {
    try {
      const headers = await this._getAuthHeaders();

      // 🔹 Récupérer l'id interne de la facture
      const invoiceId = await InvoiceStatusModel.getInvoiceIdByPdpId(submissionId);
      if (!invoiceId) {
        logger.warn(`[SuperPDPAdapter] Aucun invoice trouvé pour submissionId ${submissionId}`);
        return [];
      }

      // 🔹 Pagination pour récupérer tous les events
      let apiEvents = [];
      let hasAfter = true;
      let lastEventId = 0;

      while (hasAfter) {
        const response = await this.client.get('/v1.beta/invoice_events', {
          headers,
          params: { invoice_id: submissionId, limit: 100, starting_after_id: lastEventId },
        });

        const pageEvents = response.data.data.map(ev => ({
          eventId: ev.id,
          date: ev.created_at,
          apiCode: ev.status_code,
          label: ev.status_text,
          submissionId: ev.invoice_id,
          attachments: ev.attachments,
          details: ev.details,
        }));

        if (pageEvents.length) lastEventId = pageEvents[pageEvents.length - 1].eventId;
        apiEvents.push(...pageEvents);

        hasAfter = response.data.has_after;
      }

      logger.info(`[SuperPDPAdapter] ✅ ${apiEvents.length} event(s) récupéré(s) pour invoice ${invoiceId}`);
      logger.debug({ apiEvents }, `[SuperPDPAdapter] 📦 Détail des events récupérés`);

      // 🔹 Mapping PDP API → codes métier (integer)
      const PDP_TO_BUSINESS_STATUS = {
        "api:uploaded": 202,
        "api:received": 202,
        "api:validated": 203,
        "api:rejected": 210,
        // "api:invalid" n'est pas mappé → ignoré
      };

      // 🔹 Filtrer uniquement les events mappables
      const validEvents = apiEvents.filter(ev => PDP_TO_BUSINESS_STATUS[ev.apiCode]);

      // 🔹 Ne prendre que le dernier statut valide
      const lastValidEvent = validEvents[validEvents.length - 1];

      if (lastValidEvent) {
        const numericStatus = PDP_TO_BUSINESS_STATUS[lastValidEvent.apiCode];

        logger.info(`[SuperPDPAdapter] Préparation updateBusinessStatus pour invoice ${invoiceId}`, {
          invoiceId,
          lastEventApiCode: lastValidEvent.apiCode,
          mappedStatusCode: numericStatus,
          lastEventLabel: lastValidEvent.label,
          clientComment: lastValidEvent.details?.[0]?.reason || null
        });

        await InvoiceStatusModel.updateBusinessStatus(invoiceId, {
          statusCode: numericStatus,
          statusLabel: lastValidEvent.label,
          clientComment: lastValidEvent.details?.[0]?.reason || null
        });

        logger.info(`[SuperPDPAdapter] 📌 Dernier statut métier appliqué pour invoice ${invoiceId}: ${numericStatus} - ${lastValidEvent.label}`);
      } else {
        logger.info(`[SuperPDPAdapter] ⚠️ Aucun statut métier valide pour invoice ${invoiceId} (events invalides uniquement)`);
      }

      // 🔹 Logger tous les events pour debug, même ceux invalides
      apiEvents.forEach(ev => {
        logger.info(
          {
            submissionId: ev.submissionId,
            apiCode: ev.apiCode,
            label: ev.label,
            date: ev.date,
            details: ev.details
          },
          "[SuperPDP] 📊 Event facture"
        );
      });

      // 🔹 Retourne uniquement le dernier statut valide pour l'app
      return lastValidEvent ? [lastValidEvent] : [];
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