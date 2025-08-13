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

## ✅ Fonctionnalités développées *(jusqu’au Jour 9)*

- **CRUD Vendeurs** :  
  création, lecture (liste et fiche détail), modification, suppression.  
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

- Création d’une **entité Client** pour compléter le flux de facturation.  
- Consolidation des validations et flux pour gérer correctement tous les acteurs (**Vendeur** + **Client**).  
- Poursuite de l’amélioration **UX**, ajout d’écrans et d’interactions.
