# 🌐 Déployer un environnement eInvoicing sur Render

Ce guide explique comment déployer l’application **eInvoicing** sur Render, avec :
- une base PostgreSQL
- le backend en Web Service (Docker)
- le frontend en Static Site (Vite)
- des variables d’environnement cohérentes entre front / back / Auth0 / PDP

L’objectif est de pouvoir **recréer un environnement complet** en suivant les étapes, sans prise de décision supplémentaire.

## 1️⃣ Pré-requis

- Accès au dépôt : `fbonnafous31/eInvoicing`
- Un compte **Render**
- Accès à **Auth0** (Application + API déjà créées)
- Avoir les valeurs :
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_AUDIENCE`

## 2️⃣ Base de Données PostgreSQL (Render → *Databases*)

1. Aller sur Render → *New* → *PostgreSQL*
2. Choisir :

| Champ | Valeur recommandée |
|------|---------------------|
| Plan | **Starter (6€/mois)** pour éviter le sleep |
| Nom | `einvoicing-db` |
| Région | **Oregon** (pour être dans la même zone que backend) |

3. Une fois créée → onglet **Connections** → récupérer :

| Variable | Exemple |
|--------|---------|
| DB_HOST | `dpg-abc123.oregon-postgres.render.com` |
| DB_USER | `einvoicing_user` |
| DB_PASSWORD | `********` (Render → Reveal) |
| DB_NAME | `einvoicing` |

> ⚠️ **DB_SCHEMA** n’est pas fourni par Render → valeur standard : `public`

## 3️⃣ Backend (Render → *Web Service*)

1. Render → *New* → *Web Service*
2. Source : **GitHub**
3. Repo : `eInvoicing`
4. Branch : `main` (ou `staging` selon usage)
5. Paramètres :

| Paramètre | Valeur |
|----------|--------|
| Runtime | **Docker** |
| Root Directory | `backend/` |
| Dockerfile Path | `backend/Dockerfile` |
| Region | **Oregon** |

### Variables d’environnement Backend

```
# Database
DB_HOST=xxx
DB_USER=xxx
DB_PASSWORD=xxx
DB_NAME=einvoicing
DB_SCHEMA=public
DB_PORT=5432
PORT=8080

# Auth0
AUTH0_DOMAIN=dev-xxx.eu.auth0.com
AUTH0_AUDIENCE=https://einvoicing/api

# PDP Provider
PDP_PROVIDER=sandbox

# Plateforme agréée
PA_BASE_URL=
PA_AUTH_URL=
PA_CLIENT_ID=
PA_CLIENT_SECRET=

# Encryption key (32 bytes minimum)
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4️⃣ Frontend (Render → *Static Site*)

1. Render → *New* → *Static Site*
2. Source : GitHub
3. Branch : `main` ou `staging`
4. Paramètres :

| Paramètre | Valeur |
|----------|--------|
| Root Directory | `frontend/` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist/` |

### Variables d’environnement Frontend

```
VITE_API_URL=https://<backend-name>.onrender.com
VITE_AUTH0_DOMAIN=dev-xxx.eu.auth0.com
VITE_AUTH0_CLIENT_ID=xxxxxxxx
VITE_AUTH0_AUDIENCE=https://einvoicing/api
VITE_PDP_PROVIDER=sandbox
```

## 5️⃣ À propos de `config.js` (serveurs dédiés)

Pour Render → **aucune action nécessaire**.

`config.js` ne sert **que** pour :
- un serveur Nginx
- ou une machine dédiée
- ou un conteneur docker non rebuild

Exemple :

```js
// frontend/public/config.js
window.__ENV__ = {
  VITE_API_URL: "https://api.example.com",
  VITE_AUTH0_DOMAIN: "...",
  VITE_AUTH0_CLIENT_ID: "...",
  VITE_AUTH0_AUDIENCE: "..."
};
```

## 6️⃣ Tests de bon fonctionnement

| Fonction | Attendu |
|---------|---------|
| Navigation frontend | OK |
| Login via Auth0 | Redirection correcte |
| Requêtes API | Pas d’erreur CORS |
| CRUD vendeur | Persisté DB |
| SMTP | Mail reçu (si configuré) |

## 7️⃣ Schéma simplifié

```
Frontend -- Auth0 --> Backend -- PostgreSQL
```

## ✅ L’environnement est opérationnel 🎉