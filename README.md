# eInvoicing – Application Web de Gestion des Factures

[![codecov](https://codecov.io/gh/fbonnafous31/eInvoicing/branch/main/graph/badge.svg?token=VOTRE_TOKEN_CODECOV)](https://codecov.io/gh/fbonnafous31/eInvoicing)
[![PDF/A Compliant](https://img.shields.io/badge/PDF/A--3-ISO_19005--3-red.svg)](https://www.pdfa.org/solution-center/)
[![Licence](https://img.shields.io/badge/Licence-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![CI](https://github.com/fbonnafous31/eInvoicing/actions/workflows/ci.yml/badge.svg)

## 📖 Contexte

Après 20 ans dans l'édition de logiciels financiers, j'ai lancé eInvoicing le 10 août 2024 avec une double ambition : explorer les technologies web modernes (React, Node.js) et construire, en solo, un produit de facturation électronique complet, de la première ligne de code à son industrialisation.

Ce projet est le fruit d'une méthodologie que j'ai baptisée **"Agile Solo"** : une approche structurée et itérative, documentée quotidiennement dans un [journal de bord](https://github.com/fbonnafous31/eInvoicing/blob/main/docs/ebook/ebook.md), où chaque décision, chaque difficulté et chaque victoire est consignée.

L'application est aujourd'hui un **produit fonctionnel, sécurisé et conforme**, prêt à être déployé et utilisé.

---

## ✍️ Journal de bord : Chronique d’un dev en liberté

Ce projet est bien plus qu’une application.
C’est le parcours d’un développeur qui quitte le salariat pour construire seul un produit, entre défis techniques, moments de doute et quête de liberté retrouvée.

Découvrez le journal de bord complet ici :
➡️ https://journal-dev-xi.vercel.app/

---

## 📜 Ma Vision : La Facturation Électronique Simple, Souveraine et Conforme

La facturation électronique ne doit pas être une contrainte. Mon ambition est de proposer une alternative aux ERP lourds et aux SaaS fermés. Un outil :

- **Simple** : Une interface claire, des parcours fluides, moins de clics.
- **Conforme par Nature** : Factur-X, PDF/A-3 et communication PDP intégrés au cœur de l'application.
- **Souverain et Indépendant** : Open-source, hébergeable sur votre infrastructure, sans verrou propriétaire.
- **Robuste** : Une architecture saine, testée et pensée pour évoluer.

En bref, un compagnon fiable pour les petites structures qui veulent rester en conformité, **sans complexité inutile**.

---

## 🌐 Site vitrine et Démo

Un site vitrine est disponible pour présenter l’application, son simulateur de gains et ses offres de services :  
➡️ **[https://e-invoicing-landing.vercel.app](https://e-invoicing-landing.vercel.app)**

Un **environnement de staging** est également accessible pour tester l'application :  
➡️ **[https://einvoicing-staging-frontend.onrender.com/](https://einvoicing-staging-frontend.onrender.com/)**

---

## ✅ Fonctionnalités Clés

- Gérer des factures de manière complète : création, suivi, génération PDF/Factur-X, communication avec des plateformes de dématérialisation partenaires (PDP).  
- Fournir un **CRUD complet** pour vendeurs, clients et factures.  
- Générer des PDF conformes **PDF/A-3**, avec XML intégré et métadonnées XMP valides.  
- Rester simple, sobre et compréhensible pour les petites structures et les freelances.  

---
 
## 🛠 Technologies

### Frontend
- React 18 + Vite  
- Bootstrap  
- react-data-table-component  
- react-pdf  
- i18n-iso-countries  

### Backend
- Node.js + Express  
- PostgreSQL  
- multer (upload fichiers)  
- xmlbuilder2 (Factur-X)  
- dotenv  

### Outils
- Vitest + Codecov (tests)  
- Github Actions (CI/CD)  
- Prometheus + Grafana (monitoring)  
- DBeaver, ESLint, Prettier, VSCode  

---
 
## 🏗 Architecture

- **Séparation Front/Back** : Une base saine pour une maintenance et des déploiements indépendants.
- **Découpage par Domaine Métier** : Le code est organisé autour des concepts métier (`sellers`, `clients`, `invoices`), ce qui le rend lisible et facile à étendre.
- **Pattern Backend Clair (MVC-like)** : La structure `Route → Controller → Service → Model` a permis de bien séparer les responsabilités.

---
## 🚀 Du Projet au Produit : Industrialisation
 
Le passage d'un projet personnel à un produit robuste repose sur l'industrialisation.
- **Tests Automatisés** : Une couverture de tests supérieure à **60%** (avec Vitest), notamment sur le backend (>90%), pour sécuriser chaque fonctionnalité.
- **Intégration Continue (CI)** : Un pipeline GitHub Actions valide le code (lint), lance les tests et mesure la couverture à chaque `push`.
- **Déploiement Continu (CD)** : Des images Docker pour le frontend (Nginx) et le backend sont générées et prêtes à être déployées.
- **Monitoring** : Les fondations du suivi des métriques backend sont posées avec Prometheus & Grafana.
- **Déploiement Reproductible** : Un script `start-einvoicing.sh` permet de lancer un environnement local complet (DB, Backend, Frontend) en une seule commande.

---

## 🔭 Prochaines étapes

- **Renforcer la couverture de tests** avec des scénarios End-to-End (E2E) automatisés pour garantir la robustesse des parcours utilisateurs critiques.
- **Recueillir les retours** des premiers utilisateurs via l'environnement de staging pour affiner l'expérience et prioriser les futures évolutions.
- **Améliorer les échanges avec les PDP** en s'appuyant sur des standards comme Swagger/OpenAPI pour faciliter l'intégration de nouvelles plateformes.

---

## 📄 Licence

Ce projet est sous licence MIT.
