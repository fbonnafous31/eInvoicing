# Jour 53 – Mise en place de la communication Front ↔ Back avec Auth0 🔗🛡️

Aujourd'hui, j'ai travaillé sur la **connexion sécurisée entre le frontend React et le backend Node.js** grâce à Auth0, afin que seules les requêtes authentifiées puissent accéder aux données sensibles des clients et factures.

---

## ✅ Ce qu’on a fait

### 1. Analyse du flux d’authentification

* Identification du besoin : **le frontend doit pouvoir appeler le backend avec un token valide**, et le backend doit vérifier ce token pour sécuriser les endpoints.
* Compréhension des enjeux :
  - éviter les accès non autorisés (erreurs 403),
  - lier chaque utilisateur Auth0 à son vendeur pour filtrer les données,
  - préparer la gestion future des rôles et permissions fines.

### 2. Configuration côté Auth0

* Création de l’**API eInvoicing** dans Auth0 avec un **audience** dédié (`https://api.einvoicing.local`).
* Attribution des permissions à l’application SPA dans l’onglet **API Permissions**, pour que le frontend puisse demander un token.

### 3. Mise à jour du frontend

* Adaptation de `useAuth.js` : récupération d’un **access token via `getAccessTokenSilently()`** avec l’audience de l’API.
* Transmission de ce token dans le **header Authorization : Bearer** pour toutes les requêtes vers le backend.

### 4. Mise à jour du backend

* Installation et configuration de **express-jwt + jwks-rsa** pour vérifier les JWT reçus.
* Ajout d’un middleware `checkJwt` sur toutes les routes sensibles (`/api/clients`, `/api/invoices`) pour **refuser les requêtes non authentifiées** (403).
* Création du middleware `attachSeller` : récupération du vendeur correspondant à l’utilisateur connecté (`req.user.sub`) pour filtrer les données.
* Vérification que chaque endpoint ne renvoie que les données du vendeur authentifié.

### 5. Tests et debugging

* Vérification que le token JWT contient bien :
  - `aud` correspondant à l’API (`https://api.einvoicing.local`),
  - `sub` de l’utilisateur,
* Tests d’appel depuis le frontend : le backend renvoie maintenant les clients associés au vendeur connecté.
* Debugging intensif pour résoudre :
  - `req.user` non défini (problème de middleware),
  - incohérences de noms dans le service clients (`listClients` vs `getClientsBySeller`),
  - logs manquants dans `getSellerByAuth0Id`.

---

## 📌 Pourquoi c’est important

* **Sécurité renforcée** : plus de risque d’accès aux données d’un autre vendeur.
* **Filtrage automatique des données** : chaque utilisateur ne voit que ses clients et factures.
* **Base solide pour la suite** : rôles, permissions fines, audit et contrôle.
* **Expérience utilisateur transparente** : login, token, et appels API sécurisés fonctionnent sans intervention manuelle.

---

## 📌 Prochaines étapes

* Mettre en place le **filtrage des factures** pour que chaque utilisateur ne voit que celles associées à son vendeur connecté.
* Développer la **page d'accueil** dynamique, adaptée selon que l'utilisateur corresponde à un **vendeur existant** ou à un **nouveau vendeur**, avec un aperçu clair de ses données.
* Implémenter le **processus d’inscription d’un nouveau vendeur**, permettant de créer son profil et de l’associer automatiquement à l’utilisateur Auth0 connecté.

---

👉 **Bilan de la journée** : la communication sécurisée entre le frontend et le backend est enfin fonctionnelle ! Chaque utilisateur Auth0 est correctement lié à un vendeur et peut accéder uniquement à ses données. 💪✨
