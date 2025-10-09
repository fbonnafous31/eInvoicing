// pdp/adapters/IopoleAdapter.js
import axios from 'axios';
import PDPInterface from '../PDPInterface.js';
import { URLSearchParams } from 'url';
import fs from 'fs';
import FormData from 'form-data';

export default class IopoleAdapter extends PDPInterface {
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

    /** 🔑 Obtient un token OAuth2 si nécessaire */
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
        // token = 10 min, on le rafraîchit après 9 min
        this.tokenExpiry = now + 9 * 60 * 1000;

        return this.token;
    }

    async sendInvoice(payload, { isSandbox = false } = {}) {
    const token = await this._getAccessToken();

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(payload.filePath)); // PDF ou XML

        // --- Envoi au PDP ---
        const response = await this.client.post('/v1/invoice', form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`,
        },
        });

        const invoiceId = response.data?.id;
        console.log(`[IopoleAdapter] ✅ Facture envoyée avec succès → ID PDP: ${invoiceId}`);

        // --- Récupération du statut ---
        let status = null;
        if (invoiceId && !isSandbox) {
        try {
            status = await this.fetchStatus(invoiceId);
            console.log(`[IopoleAdapter] 📦 Statut récupéré pour ${invoiceId}:`, status);
        } catch (err) {
            console.warn('[IopoleAdapter] ⚠️ fetchStatus a échoué (sandbox probable):', err.message);
        }
        } else {
        console.log('[IopoleAdapter] 🧪 Mode sandbox détecté, aucun statut récupéré.');
        }

        // --- Retour cohérent ---
        return {
        success: true,
        type: 'iopole',
        id: invoiceId,
        message: 'Facture envoyée avec succès vers la PDP Iopole',
        raw: response.data,
        status,
        };

    } catch (error) {
        console.error('[IopoleAdapter] ❌ Erreur lors de l’envoi:', error.message);
        throw this._normalizeError(error);
    }
    }

    /** 📥 Envoie un statut de facture (ex: PAYÉ) */
    async sendStatus(invoicePdpId, payload) {
        const token = await this._getAccessToken();
        try {
        const response = await this.client.post(
            `/invoices/${invoicePdpId}/status`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        return {
            success: true,
            message: response.data?.message || null,
        };
        } catch (error) {
        console.error('[IopoleAdapter] sendStatus error:', error.message);
        throw this._normalizeError(error);
        }
    }

    /** ⚠️ Normalise les erreurs pour un retour cohérent */
    _normalizeError(error) {
        if (error.response) {
        return {
            message: error.response.data?.message || 'Erreur PDP distante',
            statusCode: error.response.status,
            details: error.response.data,
        };
        }
        if (error.request) {
        return { message: 'Aucune réponse du PDP distant', statusCode: 504 };
        }
        return { message: error.message, statusCode: 500 };
    }

    /** 🔍 Récupère l'historique des statuts d’une facture */
    async fetchStatus(invoiceId) {
        const token = await this._getAccessToken();

        try {
            const response = await this.client.get(`/v1/invoice/${invoiceId}/status-history`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Retourne l'historique tel quel ou le transforme si besoin
            return response.data.map(entry => ({
                statusId: entry.statusId,
                date: entry.date,
                destType: entry.destType,
                code: entry.status?.code || null,
                networkCode: entry.status?.networkCode || null,
                invoiceId: entry.invoiceId,
                xml: entry.xml,
                json: entry.json,
            }));
        } catch (err) {
            console.error('[IopoleAdapter] fetchStatus error:', err.message);
            throw this._normalizeError(err);
        }
    }

}
