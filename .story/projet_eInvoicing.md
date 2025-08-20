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
- **Outils complémentaires** : DBeaver, ESLint, Prettier, Bootstrap, react-data-table-component  
- **Gestion environnement** : Variables d’environnement pour sécuriser les accès sensibles (ex : mot de passe DB)  

---

## 🏗 Architecture et organisation

- Séparation **frontend / backend** avec **découpage par domaine métier** :  
  **Vendeurs**, **Acheteurs**, **Factures**.  
- Modules backend isolés pour chaque domaine :  
  `models`, `services`, `controllers` et `routes`.  
- Frontend basé sur des **composants réutilisables** (`SellerForm`, `SellersList`, etc.) et navigation claire via une **barre de menu**.

---

## ✅ Fonctionnalités développées *(jusqu’au Jour 13)*

- **CRUD Vendeurs** :  
  création, lecture (liste et fiche détail), modification, suppression.  
- **CRUD Clients** :  
  création, lecture (liste et fiche détail), modification, suppression.    
- **CRUD Factures** :  
  liste       
- **Formulaires complets et validations** :  
  - tous les champs nécessaires  
  - validations frontend et backend  
  - validation SIRET (France)  
- **Feedback utilisateur** : messages succès/erreur, redirection fluide.  
- **UX et design** : tableaux stylés, Bootstrap, navigation intuitive.  
- **Gestion du projet** :  
  - suivi quotidien  
  - documentation en Markdown  
  - utilisation de ChatGPT comme collaborateur technique pour accélérer le développement et assurer la qualité du code.

---
## Rappel – Composants et services réutilisables

- Privilégier **les composants UI réutilisables** (`InputField`, `TextAreaField`, `EllipsisCell`, ...) pour uniformité.
- Utiliser **les services centralisés** pour les appels API afin de garder cohérence et validations.


## 📌 Prochaines étapes


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

## Architecture frontend
├── App.css
├── App.jsx
├── AppRoutes.jsx
├── architecture.txt
├── assets
│   └── react.svg
├── components
│   ├── Breadcrumb.jsx
│   ├── common
│   │   ├── EllipsisCell.jsx
│   │   └── SellerAuditPanel.jsx
│   ├── form
│   │   ├── FormSection.jsx
│   │   ├── InputField.jsx
│   │   └── TextAreaField.jsx
│   ├── invoices
│   │   ├── InvoiceForm.jsx
│   │   ├── InvoiceHeader.jsx
│   │   ├── InvoiceLines.jsx
│   │   ├── SupportingDocs.jsx
│   │   └── TaxBases.jsx
│   └── NavBar.jsx
├── constants
│   ├── companyTypes.js
│   └── paymentTerms.js
├── hooks
│   └── useSellers.js
├── index.css
├── main.jsx
├── modules
│   └── sellers
│       ├── datatableStyles.js
│       └── sellerColumns.jsx
├── pages
│   ├── clients
│   │   ├── ClientDetail.jsx
│   │   ├── ClientForm.jsx
│   │   ├── ClientsList.jsx
│   │   ├── ClientsPage.jsx
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
    ├── formatters.js
    ├── siret.js
    └── validators.js