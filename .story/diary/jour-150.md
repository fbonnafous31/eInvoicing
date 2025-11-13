# Jour 150 – Docker, volumes et configuration unifiée pour dev local et Render 🐳⚡

Aujourd’hui, l’objectif était de **stabiliser complètement l’environnement Docker** pour que l’application fonctionne **en local comme sur Render**, avec **une seule branche GitHub** et une configuration unifiée.

---

## 🎯 Objectif de la session

* Assurer que le **frontend et le backend tournent correctement en Docker**.
* Uniformiser les **URLs via VITE_API_URL et window.**ENV**** pour dev local, staging et prod.
* Résoudre les problèmes liés à **Auth0, SSL et PostgreSQL** selon l’environnement.
* Garantir que la **génération de PDF** fonctionne même avec la structure de dossiers spécifique de Render.
* Automatiser la **création des dossiers et symlinks** pour les fichiers uploads afin de ne plus manipuler manuellement les PDFs.

> L’idée : avoir un **setup Docker complet et fiable**, prêt pour développement local ou déploiement Render, sans toucher au code de l’application.

---

## 🛠️ Travail technique effectué

### 1. Docker et volumes

* Configuration de **backend, frontend et PostgreSQL** avec réseau dédié et volumes persistants (`pgdata` et `uploads`).
* Exposition du **port backend 3000** pour éviter les problèmes de CORS côté frontend.
* Gestion du volume `uploads` pour que les fichiers PDF générés soient **persistants et accessibles**.

### 2. Auth0 et environnement

* Mise en place de **window.**ENV**** en local et config.js runtime pour prod/staging.
* Résolution des **mismatches HTTP/HTTPS** pour Auth0 et l’audience locale.
* Adaptation automatique du middleware Auth0 selon l’environnement (dev vs prod).

### 3. PostgreSQL et SSL

* Identification du problème “The server does not support SSL” en local.
* Solution : SSL désactivé localement (`ssl: false` ou `PGSSLMODE=disable`) et activé sur Render.
* Basculage automatique selon `NODE_ENV`, sans modifier le code.

### 4. Gestion des PDFs et symlinks

* Les PDFs étaient générés dans `/uploads/invoices` mais l’application cherchait `/uploads/app/invoices`.
* Création automatique du **dossier `/uploads/app/invoices` et d’un symlink vers `/uploads/invoices`** dans le script d’installation.
* Préservation des fichiers existants dans le volume lors des redéploiements.

### 5. Script d’installation unifié

* Automatisation de toutes les étapes : pull images, up containers, init DB, config frontend, création des dossiers et symlinks.
* Plus besoin d’interventions manuelles pour que tout fonctionne.

---

## 🧪 Résultats

✅ Docker local et Render fonctionnent avec **la même configuration GitHub**.
✅ Backend écoute HTTP local, mais Auth0 et SSL fonctionnent en staging/prod.
✅ PDFs générés correctement et accessibles via le bon chemin grâce au symlink.
✅ Volume uploads persistent et files existants sécurisés.
✅ Frontend utilise **window.**ENV**** pour toutes les URLs, uniforme entre environnements.

---

## 💭 Ressenti / humain

* Beaucoup de détails techniques aujourd’hui, mais le **système est enfin cohérent et stable**.
* Voir **frontend, backend, DB et Auth0 fonctionner ensemble**, avec PDFs et uploads accessibles, est très satisfaisant.
* Le script d’installation unique apporte **un vrai confort pour le dev et le déploiement**, plus de manipulations manuelles ni de surprises.
* Un pas important vers un **setup Docker fiable et reproductible**, clé pour la suite du projet.

---

## ✅ Bilan du jour

* Docker unifié pour dev local et Render : ✅
* Auth0 et SSL adaptés selon l’environnement : ✅
* Volumes et symlink pour PDFs : ✅
* Script d’installation automatisé et complet : ✅
* Frontend uniforme via window.**ENV** : ✅
* Génération PDF fiable et compatible : ✅

> Une journée dense mais essentielle :
> **l’environnement Docker d’eInvoicing est maintenant stable et prêt pour le dev comme pour la prod**.
