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
  - **Backend** : `multer` pour l'upload de fichiers, `node-zugferd` et `xmlbuilder2` pour la génération Factur-X, `pg` pour l'accès à la base de données.
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

---
## Rappel – Composants et services réutilisables

- Privilégier **les composants UI réutilisables** (`InputField`, `TextAreaField`, `EllipsisCell`, ...) pour uniformité.
- Utiliser **les services centralisés** pour les appels API afin de garder cohérence et validations.


## 📌 Prochaines étapes
- **Finalisation de la conformité PDF/A-3** : Résoudre les derniers points techniques (ex: profils de couleur, `AFRelationship`) pour obtenir une validation ISO 19005-3 complète.
- **Authentification et gestion des utilisateurs** : Mettre en place un système de comptes pour sécuriser l'accès aux données par vendeur.
- **Amélioration de l'UX/UI** : 
  - Mise en place d'un tableau de bord.
- **Industrialisation** :
  - Mise en place de tests unitaires et d'intégration (`Vitest`).
  - Logging et monitoring des API.
  - Préparation au déploiement (CI/CD).
- **Évolution fonctionnelle** :
  - Gestion du cycle de vie des factures (statuts : `draft`, `issued`, `paid`...).
  - Connexion à des plateformes de dématérialisation partenaires (PDP).

## Architecture projet
project/
│
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── modules/
│ │ │ ├── sellers/
│ │ │ ├── buyers/
│ │ │ └── invoices/
│ │ └── utils/
│ └── package.json
│
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── modules/
│ │ │ ├── sellers/
│ │ │ │ ├── sellers.model.js
│ │ │ │ ├── sellers.controller.js
│ │ │ │ ├── sellers.routes.js
│ │ │ │ └── sellers.service.js
│ │ │ ├── buyers/
│ │ │ └── invoices/
│ │ ├── middlewares/
│ │ └── utils/
│ ├── package.json
│ └── server.js
│
├── docs/
├── scripts/
└── README.md

## Architecture backend
.
├── architecture.txt
├── config
│   └── db.js
├── middlewares
│   ├── errorHandler.js
│   └── upload.js
├── modules
│   ├── clients
│   │   ├── clients.controller.js
│   │   ├── clients.model.js
│   │   ├── clients.route.js
│   │   └── clients.service.js
│   ├── invoices
│   │   ├── invoiceAttachments.model.js
│   │   ├── invoiceClient.model.js
│   │   ├── invoiceClient.service.js
│   │   ├── invoices.controller.js
│   │   ├── invoices.model.js
│   │   ├── invoices.route.js
│   │   └── invoices.service.js
│   └── sellers
│       ├── sellers.controller.js
│       ├── sellers.model.js
│       ├── sellers.route.js
│       └── sellers.service.js
└── utils
    ├── facturx-generator.js
    ├── fileNaming.js
    └── invoice-pdf
        └── generateInvoicePdf.js

## Architecture frontend
.
├── App.css
├── App.jsx
├── AppRoutes.jsx
├── architecture.txt
├── assets
│   └── react.svg
├── components
│   ├── Breadcrumb.jsx
│   ├── common
│   │   ├── AuditPanel.jsx
│   │   └── EllipsisCell.jsx
│   ├── form
│   │   ├── FormSection.jsx
│   │   ├── InputField.jsx
│   │   ├── SelectField.jsx
│   │   └── TextAreaField.jsx
│   ├── invoices
│   │   ├── InvoiceClient.jsx
│   │   ├── InvoiceForm.jsx
│   │   ├── InvoiceHeader.jsx
│   │   ├── InvoiceLines.jsx
│   │   ├── InvoiceTabs.jsx
│   │   ├── PdfViewer.jsx
│   │   ├── SupportingDocs.jsx
│   │   └── TaxBases.jsx
│   └── NavBar.jsx
├── constants
│   ├── companyTypes.js
│   └── paymentTerms.js
├── index.css
├── main.jsx
├── modules
│   ├── clients
│   │   ├── clientColumns.jsx
│   │   ├── useClientForm.js
│   │   └── useClients.js
│   ├── common
│   │   └── datatableStyles.js
│   ├── invoices
│   │   └── invoiceColumns.jsx
│   └── sellers
│       ├── sellerColumns.jsx
│       ├── useSellerForm.js
│       └── useSellers.js
├── pages
│   ├── clients
│   │   ├── ClientDetail.jsx
│   │   ├── ClientForm.jsx
│   │   ├── ClientsList.jsx
│   │   ├── ClientsPage.jsx
│   │   ├── fields
│   │   └── NewClient.jsx
│   ├── invoices
│   │   ├── InvoicesList.jsx
│   │   └── NewInvoice.jsx
│   ├── NotFound.jsx
│   └── sellers
│       ├── fields
│       ├── NewSeller.jsx
│       ├── SellerDetail.jsx
│       ├── SellerForm.jsx
│       ├── SellersList.jsx
│       └── SellersPage.jsx
├── services
│   ├── clients.js
│   ├── invoices.js
│   └── sellers.js
└── utils
    ├── architecture.txt
    ├── formatters
    │   └── formatters.js
    └── validators
        ├── client.js
        ├── contact.js
        ├── invoice.js
        ├── seller.js
        └── siret.js
