# 📄 Contexte global du projet **eInvoicing**

## 🎯 Objectif du projet

- Développer une application web pour la **gestion complète des factures** :  
  création, suivi, réception, génération de formats standards (**UBL**, **Factur-X**) et communication via **API**.  
- À terme, tendre vers un **opérateur de dématérialisation**.  
- Application progressive, construite pas à pas avec un **découpage clair entre frontend et backend**.

---

## 🛠 Technologies choisies

- **Frontend** : React + Vite  
- **Backend** : Node.js + Express  
- **Base de données** : PostgreSQL  
- **Outils et bibliothèques clés** :
  - **Frontend** : `axios` pour les appels API, `react-data-table-component` pour les tableaux, `react-pdf` pour l'affichage de documents, `Bootstrap` pour le style.
  - **Backend** : `multer` pour l'upload de fichiers, `xmlbuilder2` pour la génération Factur-X, `pg` pour l'accès à la base de données.
- **Gestion environnement** : Variables d’environnement pour sécuriser les accès sensibles (ex : mot de passe DB)  

---

## 🏗 Architecture et organisation

- Séparation **frontend / backend** avec **découpage par domaine métier** :  
  **Vendeurs**, **Acheteurs**, **Factures**.  
- Modules backend isolés pour chaque domaine :  
  `models`, `services`, `controllers` et `routes`.  
- Frontend basé sur des **composants réutilisables** (`SellerForm`, `SellersList`, etc.) et navigation claire via une **barre de menu**.

---

## ✅ Fonctionnalités développées

- **CRUD Vendeurs** :  
  création, lecture (liste et fiche détail), modification, suppression.  
- **CRUD Clients** :  
  création, lecture (liste et fiche détail), modification, suppression.    
- **CRUD complet des Factures** : Création, lecture, mise à jour et suppression des factures, avec gestion des lignes de facture, des taxes et des informations du client associé.
- **Génération de PDF de facture** : Création automatique du visuel de la facture au format PDF à partir des données (vendeur, client, lignes, totaux), éliminant le besoin d'un justificatif externe.
- **Génération Factur-X finalisée** : Création d'un fichier XML Factur-X (profil MINIMUM) validé, contenant toutes les données structurées de la facture.
- **Intégration PDF/A-3** : Le XML Factur-X et les pièces jointes sont embarqués dans le PDF généré, qui est préparé pour la conformité PDF/A-3 (métadonnées XMP incluses).
- **Gestion des pièces jointes** : Upload de fichiers (via `multer`) avec distinction entre le document principal (si uploadé) et les documents additionnels.
- **Formulaires complets et validations** :  
  - Pré-remplissage intelligent des formulaires (client existant, vendeur par défaut).
  - tous les champs nécessaires  
  - validations frontend et backend  
  - validation SIRET (France)  
- **Feedback utilisateur** : messages succès/erreur, redirection fluide.  
- **UX et design** : tableaux stylés, Bootstrap, navigation intuitive.  
- **Visionneuse PDF intégrée** : Affichage des PDF (factures, pièces jointes) directement dans l'interface avec des contrôles de navigation, zoom et téléchargement.
- **Intégrité des données** : Utilisation de transactions PostgreSQL pour garantir la cohérence des opérations complexes sur la base de données.
- **Gestion du projet** :  
  - suivi quotidien  
  - documentation en Markdown  
  - utilisation de ChatGPT comme collaborateur technique pour accélérer le développement et assurer la qualité du code.
- **Authentification et gestion des utilisateurs** : Mettre en place un système de comptes pour sécuriser l'accès aux données par vendeur.
- **Évolution fonctionnelle** :
  - Gestion du cycle de vie des factures (statuts : `draft`, `issued`, `paid`...).
  - Connexion à des plateformes de dématérialisation partenaires (PDP).
- **Industrialisation** :
  - Mise en place de tests unitaires et d'intégration (`Vitest`).

---
## Rappel – Composants et services réutilisables

- Privilégier **les composants UI réutilisables** (`InputField`, `TextAreaField`, `EllipsisCell`, ...) pour uniformité.
- Utiliser **les services centralisés** pour les appels API afin de garder cohérence et validations.


## 📌 Prochaines étapes
- **Industrialisation** :
  - Logging et monitoring des API.
  - Préparation au déploiement (CI/CD).
- **Finalisation de la conformité PDF/A-3** : Résoudre les derniers points techniques (pour obtenir une validation ISO 19005-3 complète.

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



