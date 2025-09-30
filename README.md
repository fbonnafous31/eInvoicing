# eInvoicing – Application Web de Gestion des Factures

[![codecov](https://codecov.io/gh/fbonnafous31/eInvoicing/branch/main/graph/badge.svg)](https://codecov.io/gh/fbonnafous31/eInvoicing)

## 📖 Contexte

Après avoir travaillé dans le domaine de la gestion financière, et plus spécifiquement sur la facturation électronique et la conformité ERP, j’ai décidé de développer un outil personnel permettant de **créer, suivre et gérer des factures électroniques**.  
Ce projet a un double objectif :

1. **Pédagogique** : renforcer mes compétences en développement web moderne (React, Node.js, PostgreSQL) et architecture fullstack.  
2. **Pratique** : créer une application complète et modulable, qui pourrait être utile à d’autres développeurs ou à de futurs partenaires.  

Le projet est conçu **jour après jour**, avec une approche progressive, structurée et documentée à chaque étape.  

---

## 🎯 Objectifs du projet

- Développer une application web pour la gestion complète des factures : création, suivi, réception, génération du format standard `Factur-X`, et communication via API.  
- Implémenter un **CRUD complet pour les vendeurs, clients et factures**.  
- Générer automatiquement des factures au format **PDF** et assurer leur conformité **PDF/A-3**.  
- Préparer l’application à évoluer vers une **Plateforme de Dématérialisation Partenaire (PDP)**.  

---

## 🛠 Technologies utilisées

### Frontend
- **React 18 + Vite** : interface moderne et réactive.  
- **Bootstrap** : mise en forme rapide et homogène.  
- **react-data-table-component** : tableaux interactifs.  
- **react-pdf** : visionneuse PDF intégrée.  
- **i18n-iso-countries** : gestion normalisée des codes pays.  

### Backend
- **Node.js + Express** : API REST structurée et modulaire.  
- **PostgreSQL** : base de données relationnelle robuste.  
- **multer** : upload et gestion des pièces jointes.  
- **xmlbuilder2** : génération du XML Factur-X.  
- **dotenv** : gestion sécurisée des variables d’environnement.  

### Outils complémentaires
- **Vitest + Codecov** : tests unitaires et couverture.  
- **Github Actions** : CI/CD et déploiement automatisé.  
- **Prometheus + Grafana** : logging et monitoring.  
- **DBeaver** : gestion de la base.  
- **ESLint / Prettier** : standardisation du code.  
- **VSCode** : IDE principal.  

---

## 🏗 Architecture du projet

- Séparation **frontend / backend** pour clarifier le rôle de chaque couche.  
- Découpage **par domaine métier** : vendeurs, clients, factures.  
- **Pattern backend** : Model → Service → Controller → Route.  
- **Composants frontend réutilisables**.  

---

## ✅ Fonctionnalités développées

### 1. Gestion des vendeurs et clients
- **CRUD complet** avec validations (SIRET, formats bancaires, adresses).  
- Tableaux interactifs avec tri, recherche, pagination.  
- Fiche détail avec mode lecture / édition.  

### 2. Gestion des factures
- Création, mise à jour, suppression et suivi des factures.  
- Gestion des lignes de facture, taxes et pièces jointes.  
- Génération automatique en **PDF** avec intégration des données.  
- **Conformité PDF/A-3** : métadonnées XMP, intégration du XML Factur-X et des justificatifs.  
- Visionneuse PDF intégrée dans l’application.  

### 3. Standards de facturation
- Génération **Factur-X (profil BASIC)** validé.  
- Support initial pour **UBL**.  
- Intégration du XML dans le PDF pour compatibilité réglementaire.  

### 4. Authentification et sécurité
- **Auth0** pour la gestion des comptes utilisateurs.  
- Sécurisation des routes via **JWT**.  
- Parcours utilisateur fluide : inscription → fiche vendeur → accès protégé.  

### 5. Simulation PDP
- Connexion à une **plateforme de dématérialisation partenaire simulée**.  
- Émission et réception de factures.  
- Gestion du cycle de vie (émission, encaissement).  

### 6. Industrialisation
- **Tests unitaires et d’intégration** (Vitest).  
- **CI/CD** (Github Actions).  
- **Monitoring** via Prometheus et Grafana.  
- Documentation et journal de bord quotidien.  

---

## 📌 Méthodologie de développement

- **Approche progressive et pédagogique** : chaque module est développé puis documenté.  
- Utilisation de **ChatGPT comme collaborateur technique** pour accélérer le développement.  
- Priorité à la **maintenabilité** : composants et services réutilisables, validations cohérentes.  
- Tests réguliers pour sécuriser la base de code.  

---

## 🚀 Prochaines étapes

### Fonctionnelles
- Finalisation de la conformité **PDF/A-3** pour validation ISO 19005-3 complète.  
- Mise en place d’un environnement de **staging** sans authentification (RGPD-friendly).  
- Amélioration des échanges avec les PDP (interopérabilité via Swagger officiel).  

### Techniques
- Amélioration de la couverture de tests.  
- Renforcement du monitoring en production.  
- Communication sur le projet (LinkedIn, articles).  

---

## 📄 Licence

- **Licence pédagogique / open source** : MIT (ou équivalent).  

---

## 💡 Notes pédagogiques

- Chaque jour de développement est documenté en Markdown.  
- L’approche est itérative : un module complet → validation → passage au suivant.  
- L’objectif est autant **l’apprentissage** que la construction d’un outil **réel et robuste**.  
