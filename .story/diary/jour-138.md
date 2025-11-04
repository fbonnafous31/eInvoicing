# Jour 138 – Finalisation preprod, Auth0 et documentation 📚🛠️

Aujourd’hui, l’objectif était de **finaliser la préproduction** et de stabiliser l’environnement, tout en avançant sur la documentation du produit.

Même si certaines parties restent en développement (notamment l’hébergement et le stockage de la documentation), j’ai énormément avancé et mis en place des bases solides pour la suite. 😌

---

## 🧩 Les avancées techniques

### 1️⃣ Déploiement de la preprod finalisé

* Frontend, backend, Auth0 et PostgreSQL connectés et fonctionnels ensemble.
* Vérification des flux JWT : login → API → vérification d’audience isolée par environnement.
* Preprod prête à accueillir des **bêta-testeurs**.

---

### 2️⃣ Auth0 dédié pour la preprod

J’ai écrit un guide complet pour créer des environnements isolés dans le même tenant Auth0 :

* **Frontend SPA dédié** → Client ID unique par environnement
* **API backend dédiée** → Audience unique et RS256
* Variables d’environnement mises à jour (`VITE_API_URL`, `VITE_AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`)
* Isolement total entre dev, staging, preprod et prod
* Flux JWT validé : un utilisateur peut se connecter dans tous les environnements sans conflit

> Ce guide est réutilisable pour créer **tous les nouveaux environnements** à l’avenir.

---

### 3️⃣ Documentation et ebook

* Ebook mis à jour avec toutes les fonctionnalités existantes.
* Document récapitulatif de l’ensemble des fonctionnalités produit : chaque module, chaque workflow, toutes les validations et spécificités PDF/A-3 et Factur-X.
* Base solide pour rédiger le guide utilisateur et la documentation technique.

---

## 🌱 Points humains / ressentis

En voyant les **problèmes liés à la GED et à l’hébergement**, j’ai pris un petit coup sur la tête… 😅
C’est le cœur du projet et je pensais toucher au but avec la préprod.

Mais je me rappelle :

> Faire des murs, c’est normal. Trouver des solutions, c’est ce qui fait avancer un projet solo.

Même si l’hébergement est **encore en bêta**, le reste fonctionne parfaitement et apporte déjà **une valeur concrète**.

C’est un rappel : **progresser sur un produit complet, seul, prend du temps et demande de l’adaptabilité**.

---

## ✅ Bilan du jour

* Preprod finalisée et fonctionnelle ✅
* Auth0 mis à jour avec isolation complète par environnement ✅
* Guide de création d’environnements Auth0 rédigé ✅
* Ebook et documentation produit mis à jour ✅
* Réflexion sur l’hébergement Bêta et solutions GED en cours ✅

> Même face aux obstacles, je continue à avancer. Chaque bloc stabilisé est un pas vers le produit final.

---

## 🚀 Perspectives

* Continuer à stabiliser l’hébergement et le stockage de la documentation.
* Recueillir les premiers retours sur la preprod via des bêta-testeurs.
* Automatiser le plus possible les déploiements pour dev → staging → preprod → prod.
* Avancer sur l’intégration des fonctionnalités avancées hébergement et GED, tout en gardant l’offre en Bêta pour le moment.
