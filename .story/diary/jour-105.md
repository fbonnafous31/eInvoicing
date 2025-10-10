# Jour 105 – Intégration PDP Iopole et suivi des factures 🚀📄

Aujourd’hui, on attaque une étape clé : **l’envoi des factures via Iopole et la gestion de leur statut**. Après plusieurs sessions à préparer l’infrastructure, j’ai enfin pu connecter mon application à un PDP réel, et suivre mes factures quasiment en temps réel. 🕵️‍♂️💻

## 1. Analyse de la documentation Iopole 📚

Avant tout, il a fallu **lire et comprendre la doc de l’API Iopole** :

* Endpoint OAuth2 : `https://auth.ppd.iopole.fr/realms/iopole/protocol/openid-connect/token`
* Flow : `client_credentials`
* Scopes requis : `oauth2ClientCredentials`
* Endpoint envoi facture : `/v1/invoice`
* Endpoint récupération statut : `/v1/invoice/{invoiceId}/status-history`

Cette étape m’a permis de savoir exactement **quelles informations envoyer et comment récupérer le statut des factures**.

## 2. Création et configuration du compte Iopole 🛠️

Pour tester, j’ai créé un **compte sandbox Iopole** et récupéré :

* `client_id`
* `client_secret`
* `baseURL` et `authURL` pour les requêtes API

Ces informations ont été **stockées dans mes variables d’environnement** pour plus de sécurité et de flexibilité.

```env
PDP_PROVIDER=iopole
IOPOLE_BASE_URL=https://api.ppd.iopole.fr
IOPOLE_AUTH_URL=https://auth.ppd.iopole.fr
IOPOLE_CLIENT_ID=<ton_client_id>
IOPOLE_CLIENT_SECRET=<ton_client_secret>
```

## 3. Adaptateur Iopole (`IopoleAdapter`) ⚙️

Ensuite, j’ai mis à jour mon **adapter Iopole** pour gérer :

* La récupération du token OAuth2 automatiquement (`_getAccessToken`)
* L’envoi de la facture via `/v1/invoice`
* La récupération du **statut de la facture** (`fetchStatus`) avec fallback sandbox
* La normalisation des erreurs pour renvoyer des messages cohérents en cas de problème

Points clés :

* J’ai ajouté une option `isSandbox` pour **ignorer les statuts non disponibles en sandbox**
* Le retour du `sendInvoice` contient désormais :

  * `type: 'iopole'`
  * `id` : l’ID PDP de la facture
  * `raw` : la réponse brute
  * `status` : statut récupéré si disponible

## 4. Envoi de la facture et récupération du statut 📦

Avec l’adapter prêt, j’ai pu **envoyer une facture depuis mon backend** :

```js
const result = await iopoleAdapter.sendInvoice(payload, { isSandbox: true });
console.log('[IopoleAdapter] ✅ Facture envoyée avec succès → ID PDP:', result.id);
console.log('[IopoleAdapter] 📦 Statut récupéré:', result.status);
```

Résultat : l’envoi fonctionne, le **statut est parfois vide en sandbox**, mais on a un ID PDP pour suivre la facture.

## 5. Mise à jour en base (`InvoiceStatusModel`) 💾

Enfin, pour **rendre le tout cohérent**, j’ai ajouté la mise à jour de la base :

```js
await InvoiceStatusModel.updateTechnicalStatus(invoiceLocalId, {
  technicalStatus: finalStatus, // 'validated' ou 'rejected'
  submissionId: result.id
});
```

* `technicalStatus` devient `validated` si l’envoi a réussi
* `technicalStatus` devient `rejected` si l’envoi a échoué
* `submission_id` est mis à jour pour **retracer la facture côté PDP**

Le code SQL derrière :

```sql
UPDATE invoicing.invoices
SET technical_status = $1,
    submission_id = $2,
    last_technical_update = now()
WHERE id = $3
RETURNING *;
```

## 6. Logs et suivi en temps réel 🕶️

Pour rendre l’expérience **plus transparente et fun** :

* Logs console colorés pour succès ✅ ou échec ❌
* Status récupéré en temps réel après envoi
* Possibilité de suivre facilement les factures via le `submission_id`

Résultat : on peut maintenant **envoyer, tracer et enregistrer l’état de toutes les factures depuis l’application**, presque comme un PDP réel. 🎉

---

> Journée très satisfaisante : la connexion au PDP fonctionne, l’envoi de facture est opérationnel, et les retours sont directement synchronisés en base. On a un workflow **complet et automatisé**. Next step : tester avec plusieurs factures et en conditions “réelles”. 🚀
