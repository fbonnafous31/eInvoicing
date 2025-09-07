# eInvoicing – Application Web de Gestion des Factures

## 📖 Contexte

Après avoir travaillé dans le domaine de la gestion financière, et plus spécifiquement sur la facturation électronique et la conformité ERP, j’ai décidé de développer un outil personnel permettant de **créer, suivre et gérer des factures électroniques**.  
Ce projet a un double objectif :

1. **Pédagogique** : renforcer mes compétences en développement web moderne (React, Node.js, PostgreSQL) et architecture fullstack.
2. **Pratique** : créer une application complète et modulable, qui pourrait être utile à d’autres développeurs ou à de futurs partenaires.

Le projet est conçu **jour après jour**, avec une approche progressive, structurée et documentée à chaque étape.

---

## 🎯 Objectifs du projet

- Développer une application web pour la gestion complète des factures : création, suivi, réception, génération de formats standards (UBL, Factur-X), et communication via API.
- Implémenter un **CRUD complet pour les vendeurs et les clients**.
- Fournir un socle robuste pour la **gestion de factures électroniques**, avec validation des données métier (ex. SIRET, capital social, informations bancaires).
- Préparer l’application à évoluer vers une **Plateforme de Dématérialisation Partenaire (PDP)**.

---

## 🛠 Technologies utilisées

### Frontend
- **React 18 + Vite** : interface moderne et réactive.
- **Bootstrap** : mise en forme rapide et homogène.
- **react-data-table-component** : tableaux interactifs et responsives.
- **i18n-iso-countries** : gestion normalisée des codes pays.

### Backend
- **Node.js + Express** : API REST structurée et modulable.
- **PostgreSQL** : base de données relationnelle robuste.
- **dotenv** : gestion sécurisée des variables d’environnement.

### Outils complémentaires
- **DBeaver** : gestion et exploration de la base de données.
- **ESLint / Prettier** : standardisation du code.
- **VSCode** : IDE principal.

---

## 🏗 Architecture du projet
**backend**
```
├── config
│   └── db.js
├── middlewares
├── modules
│   ├── buyers
│   ├── invoices
│   └── sellers
└── utils
```

**frontend**
```
├── App.css
├── App.jsx
├── assets
│   └── react.svg
├── components
├── index.css
├── main.jsx
├── pages
│   ├── buyers
│   ├── invoices
│   └── sellers
│── utils
```
- Séparation **frontend / backend** pour clarifier le rôle de chaque couche.
- Découpage **par domaine métier** : vendeurs, clients, factures.
- **Modules backend isolés** : models, services, controllers, routes.
- **Composants frontend réutilisables** (`SellerForm`, `ClientsList`, etc.) pour maintenir la cohérence et la facilité de maintenance.

---

## ✅ Fonctionnalités développées

### 1. Gestion des vendeurs
- **CRUD complet** : création, lecture, mise à jour, suppression.
- **Formulaires complets et validations** :
  - Vérification du SIRET pour les vendeurs français.
  - Longueur et types des champs validés côté frontend et backend.
- **UX améliorée** :
  - Tableau interactif avec tri, recherche et pagination.
  - Messages de succès / erreur.
  - Formulaire réutilisable pour création et modification.
  - Fiche détail avec mode lecture / édition.
  
### 2. Gestion des clients
- **CRUD complet** similaire aux vendeurs.
- Routes API dédiées `/api/clients`.
- Composants frontend réutilisables (`ClientsList`, `NewClient`, `ClientDetail`).
- Navigation fluide via la barre principale.

### 3. Architecture robuste et modulaire
- Pattern backend **Model → Service → Controller → Route**.
- Fonctions utilitaires réutilisables (`isValidSiret`, gestion capital social).
- Validation et cohérence des données dès l’entrée.

---

## 📌 Méthodologie de développement

- **Journal de bord quotidien** pour documenter chaque étape du projet.
- Utilisation de **ChatGPT comme collaborateur technique** pour accélérer la rédaction et le code.
- Mise en place progressive des fonctionnalités, avec un focus sur la qualité et la maintenabilité.
- Tests réguliers frontend / backend pour garantir la robustesse des flux.

---

## 🚀 Prochaines étapes

- **Intégration vendeur → client** lors de la création de facture.
- Développement complet des **factures** : lignes, taxes, justificatifs.
- Encodage et compression des justificatifs PDF.
- Génération de formats standards **UBL / Factur-X**.
- Amélioration UX globale et navigation fluide entre entités.
- Consolidation des validations et règles métier.

---

## 📄 Licence

- **Licence pédagogique / open source** : MIT (ou équivalent).  
  Objectif : partager le code pour l’apprentissage et permettre des contributions externes.

---

## 💡 Notes pédagogiques

- Chaque jour de développement est documenté en Markdown.
- L’approche est itérative : on construit un module complet avant de passer au suivant.
- Réutilisation maximale des composants et patterns pour faciliter l’évolution du projet.