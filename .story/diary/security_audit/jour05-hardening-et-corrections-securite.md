# 🛡️ Audit Sécurité — Upload, JWT & Mini Smoke Tests

**Date :** 11 décembre 2025

**Objet :** Renforcer l'application après les tests

## 📌 Contexte

Cette session a été consacrée au durcissement de l’API eInvoicing sur deux axes :

1. Hardening de l’authentification JWT (RS256, logs et fail-safe).
2. Mini smoke tests sécurité / vérifications rapides (phase 3).

---

## ✅ Ce qui a été réalisé

### 1. Middleware JWT (authentification)

* **RS256 imposé** : tous les tokens doivent utiliser RS256, `alg=none` ou HS256 rejetés.
* **Fail-safe / logs** :

  * Erreurs JWT renvoyées au client : message uniforme `"Invalid or missing token"`.
  * `warn` côté serveur pour tokens invalides.
  * `debug` pour tokens valides : claims `sub` (identifiant), `aud`, `exp`.
* **Validation minimale des claims** : `iss` et `aud` sont vérifiés côté middleware pour correspondre à Auth0 et à l’API.
* **Observation** : le check du `sub` côté logique métier (`attachSeller`) peut bloquer si le `sub` du token Auth0 ne correspond pas à la valeur stockée en base.

### 2. Middleware global d’erreurs / PublicError

* L’`errorHandler` existait déjà et est intégré dans `server.js`.
* Log complet côté serveur avec `requestId` et `user`.
* Cas spécifiques gérés :

  * PostgreSQL 23505 (unicité)
  * Erreurs métiers via `Error` → possibilité d’utiliser `err.publicMessage` pour messages front.
* **Axe futur** : créer un objet `PublicError` pour uniformiser et enrichir les messages métiers exposés au frontend.

---

## 🔎 Mini Smoke Tests Sécurité

### 3.1 Multi-tenancy (5 min)

* Modifier un `tenantId` dans l’URL → 403 ou 404
* Vérifie que les endpoints exposent uniquement les données du tenant autorisé.

### 3.2 Upload (10 min)

* Faux PDF → rejet (`400`, message sécurisé)
* `.exe` → rejet
* Nom de fichier chelou (`../evil.pdf`) → normalisé / rejet

### 3.3 Injection (5 min)

* Payloads `' OR 1=1 --`, `"; DROP TABLE sellers; --` → backend renvoie 400 ou 422
* Pas de fuite d’information SQL vers le client.

### 3.4 JWT ping (5 min)

* Token expiré → 401, `"Invalid or missing token"`
* Token mal signé → 401, même message
* Token sans `aud` / `iss` → rejet 401, message uniforme

### 3.5 Scan ZAP rapide (5 min)

* Spider léger + Active Scan 1 min
* Objectif : détecter fuites d’infos sensibles, injections ou uploads non sécurisés

---

## 🔐 Résultat

* Uploads sécurisés et durcis contre les attaques classiques.
* Auth JWT renforcée et fail-safe en dev / staging.
* Erreurs API normalisées et logs centralisés.
* Mini smoke tests validés → pipeline robuste pour tests et développement.
* Prochaine étape possible : `PublicError` pour messages métiers front plus précis et uniformisés.
