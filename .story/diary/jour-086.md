# Jour 86 – Finalisation du déploiement et réflexions sur la production 🛠️🚀

Aujourd’hui, j’ai travaillé sur la **finalisation du déploiement** de eInvoicing, en consolidant toutes les étapes précédentes et en automatisant au maximum le démarrage pour un développeur ou un testeur local. Même si beaucoup de progrès ont été faits, le déploiement complet n’est pas encore terminé et plusieurs points restent à finaliser.

## 🔹 Objectif du jour

* Automatiser la restauration de la base de données pour tout démarrage sur une machine vierge.
* Assurer que **frontend et backend** utilisent correctement les variables d’environnement et les URLs dynamiques.
* Corriger les problèmes de JWT et de CORS.
* Vérifier que l’authentification via Auth0 fonctionne sans blocage.
* Comprendre les contraintes spécifiques liées à un déploiement en **production**.

## 🔹 Étapes réalisées

### 1️⃣ Automatisation de la base de données

* Création d’un **script bash `start-einvoicing.sh`** qui démarre les services et restaure automatiquement le dump SQL si la base est vide :

```bash
#!/bin/bash

# Démarre les services
docker-compose up -d

# Vérifie si la base est vide
if docker-compose exec db psql -U einvoicing -d einvoicing_local -c "\dt" | grep -q "invoicing"; then
  echo "La base est déjà initialisée, pas de restauration nécessaire."
else
  echo "Restauration du dump SQL..."
  docker-compose exec db psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql
fi
```

* Cela permet un **démarrage reproductible**, tout en préservant les données existantes.
* La gestion des volumes Docker persistants est essentielle : elle empêche d’écraser la base inutilement et permet de contrôler quand la restauration a lieu.

### 2️⃣ Variables d’environnement et configuration dynamique

* Les variables **VITE_** doivent être adaptées selon l’environnement :

```js
const env = import.meta.env.DEV
  ? import.meta.env            // dev → .env Vite
  : window.__ENV__ || {};      // prod → config.js injecté par Nginx

const API_BASE = `${env.VITE_API_URL ?? 'http://localhost:3000'}/api/sellers`;
```

* Les **URLs backend** et endpoints dynamiques permettent de passer facilement d’un environnement à l’autre (local, test, prod).
* En production, un **fichier `config.js` injecté par Nginx** permettra de configurer rapidement les URLs et variables spécifiques à chaque client, sans toucher au code source.

### 3️⃣ Authentification et sécurité

* **Auth0** a été configuré pour le frontend : clients, redirections, scopes OpenID et profile.
* Test complet : connexion, génération et validation des JWT côté backend.
* Les routes sensibles sont maintenant correctement restreintes.

### 4️⃣ Résolution JWT et CORS

* Les **JWT mal formés** provenaient d’une mauvaise URL ou d’un client Auth0 mal configuré.
* Les problèmes **CORS** (cross-origin requests bloquées par le navigateur entre frontend et backend sur des ports différents) ont été résolus en configurant **Nginx comme reverse proxy** : toutes les requêtes passent par le même host et port.

### 5️⃣ Test partiel du déploiement local

* Démarrage via `./start-einvoicing.sh` → **frontend et backend opérationnels**.
* Tables du schema `invoicing` présentes et peuplées.
* Authentification et appels API testés → **OK**.
* Cependant, **certains aspects restent à finaliser** pour rendre le déploiement entièrement automatique et sécurisé.

### 6️⃣ Réflexion sur la production

Ce que je n’avais pas pressenti, c’est que **la production impose des contraintes spécifiques**, même si tout fonctionne en développement.

Dans un projet avec :

* Base de données à initialiser et sécuriser,
* Authentification avec JWT, mots de passe et secrets,
* Accès à des services externes (Auth0, API, etc.),
* Variables d’environnement spécifiques pour configurer URLs et endpoints,

il est indispensable d’adapter ces paramètres pour garantir :

* **Sécurité** : jamais de secrets ou mots de passe en clair.
* **Fiabilité** : services backend et frontend communiquent correctement.
* **Reproductibilité** : déploiement simple sur n’importe quelle machine ou serveur.

💡 En résumé : un projet peut tourner en local, mais **la production est un autre monde**. Adapter chaque configuration est indispensable pour transformer un prototype fonctionnel en produit réellement exploitable et sécurisé.

## 🔹 Points clés appris

* Le déploiement est souvent **plus exigeant que le développement** : DB, variables d’environnement, Auth0, JWT, CORS et reverse proxy.
* Automatiser les étapes critiques réduit drastiquement les risques d’erreur et facilite la vie des développeurs.
* Un produit n’est réellement prêt que lorsqu’il peut être **déployé facilement et de manière fiable**, quelle que soit la machine ou l’environnement.
* Malgré les progrès réalisés, **le déploiement complet n’est pas encore terminé** ; plusieurs points restent à finaliser pour atteindre une version pleinement automatisée et production-ready.

## 🔹 Prochaines étapes

* Terminer l’automatisation complète de la restauration DB et de la configuration dynamique.
* Documenter entièrement la procédure de démarrage local et production dans le `README`.
* Préparer un **playbook pour la production**, avec scripts, configuration Nginx et Auth0.
* Ajouter éventuellement des tests automatisés pour vérifier la bonne initialisation de la DB et du backend dans les pipelines CI/CD.

💡 Aujourd’hui, j’ai donc consolidé un déploiement partiellement automatisé et sécurisé, prêt pour les tests locaux, tout en gardant en tête les adaptations nécessaires pour la production finale.
