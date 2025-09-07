# 📄 Contexte global du projet **eInvoicing**

## 🎯 Objectif du projet

- Développer une application web pour la **gestion complète des factures** :  
  création, suivi, réception, génération de formats standards (**UBL**, **Factur-X**) et communication via **API**.  
- À terme, tendre vers une **plateforme PDP** (*Plateforme de Dématérialisation Partenaire*).  
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

## 📌 Prochaines étapes

- Création du formulaire de création d'une facture pas à pas, 
- La facture estcomposé de 4 objets :
  - Entête 
  - Lignes de factures
  - Assiettes de TVA
  - Justificatifs de facture
- Imaginer le design, définir les meilleurs approches UX (une seule grille de formaulaires avec 4 blocs, et des blocs multilignes pour les lignes et les assiettes avec une icône +, pour ajouter une ligne) ... à définir avec l'IA


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