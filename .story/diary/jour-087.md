# Jour 87 – Déploiement finalisé en local et premières réussites 🎉🐳

Aujourd’hui, je continue la saga du déploiement eInvoicing et je touche enfin à un **point de stabilité réel** : tous les conteneurs tournent, la base est accessible, et l’application communique correctement entre le frontend et le backend. Même si tout n’est pas parfait, l’impression de réussite est énorme.

---

## 🔹 Objectif du jour

* Valider que le **stack complet fonctionne localement** : DB, backend, frontend et Auth0.
* Automatiser le démarrage avec le script bash existant pour que tout soit prêt en un seul passage.
* Identifier les points restant à corriger pour une expérience pleinement fonctionnelle.

---

## 🔹 Étapes réalisées

### 1️⃣ Validation complète de la DB et du backend

* Les variables d’environnement sont correctement chargées dans le backend (sans inclure les mots de passe dans ce document).
* Test de connexion depuis le container backend :

```bash
node -e "const { Pool } = require('pg'); const pool = new Pool({ user:process.env.DB_USER, password:process.env.DB_PASSWORD, host:process.env.DB_HOST, database:process.env.DB_NAME, port:process.env.DB_PORT }); pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(console.error)"
```

> ✅ Résultat : la base répond correctement, on peut interroger les tables `invoicing`.

* La route `/api/sellers/me` fonctionne parfaitement via **curl avec token Auth0** :

```bash
curl -H "Authorization: Bearer <JWT_VALID>" http://localhost:3000/api/sellers/me
```

> ✅ Retour correct du vendeur avec toutes les informations.

---

### 2️⃣ Frontend et variables runtime

* Injection runtime via `window.__ENV__` pour le frontend compilé :

```js
window.__ENV__ = {
  VITE_API_URL: 'http://localhost:3000',
  VITE_AUTH0_DOMAIN: '<AUTH0_DOMAIN>',
  VITE_AUTH0_CLIENT_ID: '<AUTH0_CLIENT_ID>',
  VITE_AUTH0_AUDIENCE: '<AUTH0_AUDIENCE>'
};
```

* Copie dans le conteneur et reload de Nginx :

```bash
docker cp frontend/public/config.js einvoicing-frontend:/usr/share/nginx/html/config.js
docker exec einvoicing-frontend nginx -s reload
```

> ✅ Le frontend compilé peut maintenant communiquer avec le backend **sans avoir besoin de recompiler**.

---

### 3️⃣ Automatisation du démarrage

Le script `start-einvoicing.sh` est désormais presque complet :

* Démarrage des conteneurs
* Copie des fichiers de configuration (`config.js`, `index.html`, `default.conf`)
* Reload de Nginx
* Vérification et restauration de la base si nécessaire

> ✅ Résultat : un développeur peut lancer **tout le stack local en une seule commande** et avoir un système fonctionnel.

```bash
#!/bin/bash
# ===================================================
# Guide de démarrage eInvoicing
# ===================================================

# Récupère les dernières images
docker-compose pull

# Stoppe et supprime les conteneurs existants
docker-compose down

# Lancer tous les conteneurs
docker-compose up -d

# Chargement du dump DB (si DB vide)
docker-compose exec db psql -U einvoicing -d einvoicing_local -c "\dt" | grep -q "invoices" || docker-compose exec db psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql && echo "Restauration du dump SQL effectuée !"

# Copier le config.js dans le conteneur frontend afin d'injecter les variables d'environnement
docker cp frontend/config.js einvoicing-frontend:/usr/share/nginx/html/config.js

# Copier la configuration Nginx personnalisée dans le conteneur frontend.
# - Résout les problèmes CORS 
# - Gère le proxy vers /api/ pour le backend Node.js
# - Sert correctement les fichiers statiques dans /assets/ pour éviter les erreurs de type MIME
# - Permet le fallback SPA pour React (toutes les routes non existantes pointent vers index.html)
# - Gère l'accès aux fichiers uploadés via /uploads/
docker cp frontend/default.conf einvoicing-frontend:/etc/nginx/conf.d/default.conf

# Recharger Nginx pour prendre en compte le nouveau config.js
docker exec einvoicing-frontend nginx -s reload
```
---

### 4️⃣ Points positifs

* La DB est accessible et persistante grâce aux volumes Docker.
* Authentification Auth0 avec JWT fonctionne.
* Les transactions backend → DB sont opérationnelles.
* Le docker-compose est maintenant correct et stable.
* L’automatisation permet un démarrage reproductible pour tests locaux.

---

### 5️⃣ Points encore à améliorer

* Génération de PDF à revoir pour fiabilité et taille.
* UI : les listes longues ne prennent pas toujours la largeur complète.
* Logout côté frontend provoque une erreur à corriger.
* Mock-PDP non fonctionnel, à réintégrer pour tests.

---

### 6️⃣ Émotions et réflexions

Après un démarrage à **7h du matin**, voir les conteneurs tourner et le backend répondre correctement à la première requête est **immense** 😭🎉.

Même si des détails restent à corriger, les **fondations sont solides** :

* Les conteneurs communiquent.
* La DB est sécurisée et persistante.
* Les routes sécurisées fonctionnent avec JWT.
* Le frontend compilé peut être configuré dynamiquement.

C’est la **première fois que je réussis à déployer mes conteneurs et voir l’application fonctionner de bout en bout** !

---

### 7️⃣ Prochaines étapes

* Corriger les **bugs UI et PDF**.
* Fixer le **logout** pour éviter les erreurs côté frontend.
* Réintégrer et tester le **mock-PDP**.
* Documenter le **process complet** pour un autre développeur ou pour production.
* Finaliser la procédure de **déploiement local et production** avec tous les scripts et configurations Nginx/Auth0.

---

💡 En résumé :

Jour 87 marque **une grande victoire pour le déploiement local**. Tout est opérationnel, le système est sécurisé, et l’automatisation permet maintenant de lancer eInvoicing rapidement. Il reste des détails à peaufiner, mais la base est solide et fonctionnelle ! 🚀
