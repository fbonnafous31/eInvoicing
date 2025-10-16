# Configuration Auth0

Ce document décrit la configuration Auth0 pour l’application **eInvoicing**, en détaillant les applications, les APIs et les variables d’environnement.
Les notes pédagogiques permettent de comprendre le rôle de chaque élément.

---

## 1️⃣ Applications (Clients)

Dans Auth0, une **Application** représente une entité qui se connecte à Auth0 pour authentifier un utilisateur ou un service.

### Applications utilisées

1. **API Explorer Application**

   * Utilisée principalement pour tester les APIs Auth0 via Postman ou navigateur.
2. **Default App**

   * Ton frontend principal (SPA ou web app) qui fait le login des utilisateurs.

#### Paramètres à configurer dans **Default App**

* **Allowed Callback URLs** : URL(s) vers lesquelles Auth0 peut rediriger l’utilisateur après une authentification réussie (ex: `https://app.monsite.com/callback`).
* **Allowed Logout URLs** : URL(s) vers lesquelles Auth0 redirige l’utilisateur après une déconnexion.
* **Allowed Web Origins** : Domaine(s) autorisés à faire des requêtes AJAX (CORS) vers Auth0, pour sécuriser l’accès depuis le frontend.

> 💡 **Astuce** : Les callbacks sont des URLs exactes, tandis que les Web Origins concernent juste le domaine de base.

---

## 2️⃣ APIs

Une **API** dans Auth0 représente un service que ton application peut consommer, sécurisé via des tokens JWT.

### APIs utilisées

1. **Auth0 Management API**

   * Permet de gérer les utilisateurs, rôles, etc.
   * JWT signé en **RS256**.
2. **eInvoicing API**

   * Backend de l’application eInvoicing qui gère les factures et les données utilisateurs.
   * Sécurisée par JWT émis par Auth0.

> 💡 **Note pédagogique** : Chaque API a une audience spécifique et des scopes pour contrôler les permissions.

---

## 3️⃣ Variables d’environnement

Les variables permettent de configurer les clients et APIs pour le backend et le frontend.

### Backend

```env
AUTH0_DOMAIN     = API Auth0 Management API Audience // API Explorer Application.Domain // Default App.Domain
AUTH0_AUDIENCE   = eInvoicing API.Identifier
```

* **AUTH0_DOMAIN** : Domaine Auth0 pour authentifier les appels vers la Management API ou le frontend.
* **AUTH0_AUDIENCE** : Audience du backend (eInvoicing API) pour valider les JWT.

### Frontend

```env
VITE_AUTH0_DOMAIN    = API Auth0 Management API Audience // API Explorer Application.Domain // Default App.Domain
VITE_AUTH0_CLIENT_ID = Default App.Client Id
VITE_AUTH0_AUDIENCE  = eInvoicing API.Identifier
```

* **VITE_AUTH0_DOMAIN** : Domaine Auth0 utilisé par le frontend pour initier le login.
* **VITE_AUTH0_CLIENT_ID** : Client ID du frontend (Default App).
* **VITE_AUTH0_AUDIENCE** : Audience du backend pour obtenir un JWT valide.

> 💡 **Astuce** : La distinction front/backend permet de sécuriser correctement les tokens et de contrôler l’accès aux APIs.

---

## 4️⃣ Schéma visuel simplifié

```text
+----------------+        login/token         +----------------+
|                | -----------------------> |                |
|  Frontend SPA  |                           |    Auth0       |
|  Default App   | <----------------------- |                |
|                |   JWT (access_token)     |                |
+----------------+                           +----------------+
       |                                           |
       | API calls with JWT                        |
       v                                           v
+----------------+                           +----------------+
| eInvoicing API |                           | Auth0 Management API |
|   (backend)    |                           |    (admin ops)      |
+----------------+                           +----------------+
```

> Ce schéma montre le flux typique :
>
> * Le frontend utilise **Default App** pour s’authentifier via Auth0.
> * Le backend (**eInvoicing API**) valide le JWT pour sécuriser ses routes.
> * Les opérations d’administration passent par **API Explorer** et **Auth0 Management API**.
