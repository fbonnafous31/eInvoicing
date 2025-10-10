# 📄 Contexte global du projet **eInvoicing**

## 🎯 Objectif du projet

- Développer une application web pour la **gestion complète des factures** :  
  création, suivi, réception, génération du format standard `Factur-X` et communication via `API`.  
- À terme, tendre vers un **opérateur de dématérialisation**.  
- Application progressive, construite pas à pas avec un **découpage clair entre frontend et backend**.

---

## 🛠 Technologies choisies

- **Frontend** : `React` + `Vite`  
- **Backend** : `Node.js` + `Express`  
- **Base de données** : `PostgreSQL`  
- **Outils et bibliothèques clés** :
  - **Frontend** : `axios` pour les appels API, `react-data-table-component` pour les tableaux, `react-pdf` pour l'affichage de documents, `Bootstrap` pour le style.
  - **Backend** : `multer` pour l'upload de fichiers, `xmlbuilder2` pour la génération Factur-X, `pg` pour l'accès à la base de données.
- **Gestion environnement** : Variables d’environnement pour sécuriser les accès sensibles 

---

## 🏗 Architecture et organisation

- Séparation **frontend / backend** avec **découpage par domaine métier** :  
  **Vendeurs**, **Acheteurs**, **Factures**.  
- Modules backend isolés pour chaque domaine :  
  `models`, `services`, `controllers` et `routes`.  
- Frontend basé sur des **composants réutilisables** (`SellerForm`, `SellersList`, ...) et navigation claire via une **barre de menu**.

---

## ✅ Fonctionnalités développées

- **CRUD Clients et Vendeurs** : création, lecture (liste et fiche détail), modification, suppression.  
- **CRUD Factures** : Création, lecture, mise à jour et suppression des factures, avec gestion des lignes de facture, des taxes et des informations du client associé.
- **Génération de PDF de facture** : Création automatique du visuel de la facture au format PDF à partir des données (vendeur, client, lignes, totaux), éliminant le besoin d'un justificatif externe (`pdf-lib`).
- **Génération Factur-X finalisée** : Création d'un fichier XML Factur-X (profil BASIC) validé, contenant toutes les données structurées de la facture.
- **Intégration PDF/A-3** : Le XML Factur-X et les pièces jointes sont embarqués dans le PDF généré, qui est préparé pour la conformité PDF/A-3 (métadonnées XMP incluses).
- **Gestion des pièces jointes** : Upload de fichiers (`multer`) avec distinction entre le document principal et les documents additionnels.
- **Formulaires complets et validations** :  
  - Pré-remplissage intelligent des formulaires (client existant, vendeur par défaut).
  - tous les champs nécessaires  
  - validations frontend et backend  
  - validation SIRET (France)  
- **Feedback utilisateur** : messages succès/erreur, redirection fluide.  
- **UX et design** : tableaux stylés, Bootstrap, navigation intuitive.  
- **Visionneuse PDF intégrée** : Affichage des PDF (factures, pièces jointes) directement dans l'interface avec des contrôles de navigation, zoom et téléchargement.
- **Intégrité des données** : Utilisation de transactions `PostgreSQL` pour garantir la cohérence des opérations complexes sur la base de données.
- **Authentification et gestion des utilisateurs** : 
  - Mise en place un système de comptes pour sécuriser l'accès aux données par vendeur (`Auth0`).
  - Sécutisation des transactions frontend / backend (`JWT`)
- **Simulation de PDP** :
  - Connexion à des plateformes de dématérialisation partenaires (PDP).
  - Emission de factures
  - Réception du cycle de vie des factures
  - Emission de cycle de vie des factures (encaissement)
- **Industrialisation** :
  - Mise en place de tests unitaires et d'intégration (`Vitest`).
  - Couverture de test (`Codecov`).
  - Pipeline d'intégration continue et déploiement (`Github Actions`).
  - Logging et monitoring (`Promotheus`, `Grafana`).
- **Gestion du projet** :  
  - suivi quotidien  
  - documentation en Markdown  
  - utilisation de ChatGPT comme collaborateur technique pour accélérer le développement et assurer la qualité du code.
- **Mise en place d'un environnement de staging** : Sans authentification et respectant le RGPD
- **Communication sur le projet** : LinkedIn (prévu en Décembre 2025)

---
## Rappel – Composants et services réutilisables

- Privilégier **les composants UI réutilisables** (`InputField`, `TextAreaField`, `EllipsisCell`, ...) pour uniformité.
- Utiliser **les services centralisés** pour les appels API afin de garder cohérence et validations.


## 📌 Prochaines étapes
- **Finalisation de la conformité PDF/A-3** : Résoudre les derniers points techniques (pour obtenir une validation ISO 19005-3 complète).
- **Se connecter à une Sandbox d'une vrai PDP** : Iopole comme PDP choisi (pour la qualité de sa documentation)


## Architecture 
.
├── backend
│   ├── constants
│   ├── coverage
│   │   └── lcov-report
│   ├── mock-pdp
│   │   ├── routes
│   │   ├── services
│   │   └── uploads
│   ├── src
│   │   ├── config
│   │   ├── middlewares
│   │   ├── modules
│   │   ├── uploads
│   │   └── utils
│   ├── tests
│   └── uploads
├── frontend
│   ├── coverage
│   │   └── lcov-report
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── constants
│   │   ├── hooks
│   │   ├── modules
│   │   ├── pages
│   │   ├── services
│   │   └── utils
│   └── tests
├── scripts
│   └── factur-x
│       ├── js
│       ├── sh
│       └── xsd
└── sql
    ├── dataset
    ├── ddl
    └── scripts



