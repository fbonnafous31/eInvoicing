# eInvoicing – Application Web de Gestion des Factures

[![codecov](https://codecov.io/gh/fbonnafous31/eInvoicing/branch/main/graph/badge.svg)](https://codecov.io/gh/fbonnafous31/eInvoicing)

## 📖 Contexte

Après avoir travaillé dans la gestion financière et la facturation électronique, j’ai décidé de développer un outil simple pour **créer, suivre et gérer des factures électroniques**.  

Le projet a deux objectifs :  
1. **Apprentissage personnel** : renforcer mes compétences fullstack et en architecture.  
2. **Utilité concrète** : proposer un outil fonctionnel et modulable pour les petites structures.  

Chaque étape du développement est documentée et réfléchie pour rester **progressive et solide**.

---

## 🎯 Objectifs

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

**backend** : config, middlewares, modules (buyers, invoices, sellers), utils  
**frontend** : App.jsx, components, pages (buyers, invoices, sellers), utils  

- Pattern backend : Model → Service → Controller → Route  
- Découpage par domaine métier et composants frontend réutilisables pour cohérence  

## 📌 Méthodologie de développement

- **Approche progressive et pédagogique** : chaque module est développé puis documenté.  
- Utilisation de **ChatGPT comme collaborateur technique** pour accélérer le développement.  
- Priorité à la **maintenabilité** : composants et services réutilisables, validations cohérentes.  
- Tests réguliers pour sécuriser la base de code.  
---

## ✅ Fonctionnalités

### 1. Gestion des vendeurs et clients
- **CRUD complet** avec validations (SIRET, formats bancaires, adresses).  
- Tableaux interactifs avec tri, recherche, pagination.  
- Fiche détail avec mode lecture / édition.  

### 2. Gestion des factures
- Création, mise à jour, suppression et suivi des factures.  
- Gestion des lignes de facture, taxes et pièces jointes.  
- **Génération PDF** : visuel complet et automatique des factures.  
- **Conformité PDF/A-3** : XML Factur-X embarqué, métadonnées XMP conformes ISO 19005.  
- Visionneuse PDF intégrée directement dans l’application.  

### 3. Standards de facturation
- Génération **Factur-X (profil BASIC)** validé.  
- **PDF/A3** conforme à la norme **ISO 19005-3**
- Intégration du XML dans le PDF pour compatibilité réglementaire.  

### 4. Authentification et sécurité
- **Auth0** pour la gestion des comptes utilisateurs.  
- Sécurisation des routes via **JWT**.  
- Parcours utilisateur fluide : inscription → fiche vendeur → accès protégé.  

### 5. Connexion à une plateforme agréée
- Connexion à la **plateforme agréée Iopole** (Sandbox).  
- Émission et réception de factures, gestion complète du cycle de vie.  

### 6. Industrialisation
- **Tests unitaires et d’intégration** (Vitest) – couverture actuelle : 60%.  
- **CI/CD** (Github Actions).  
- **Monitoring** via Prometheus et Grafana.  
- Documentation et journal de bord quotidien.  

### 7. Gestion des pièces jointes
- Upload et distinction entre document principal et documents additionnels.  
- Intégration automatique dans le PDF/A-3.  

### 8. Environnement de staging
- Mise en place d’un **environnement de staging** simple et respectueux du RGPD 
[staging](https://einvoicing-staging-frontend.onrender.com/)  

---

## 🌐 Site vitrine

Un site vitrine est désormais disponible pour présenter l’application et son simulateur :  
[https://e-invoicing-landing.vercel.app](https://e-invoicing-landing.vercel.app)

## 📜 Vision

### Ma vision
La facturation électronique ne doit pas être une contrainte.  
Elle doit être simple, transparente et conforme dès le premier jour.  

Les petites structures n’ont pas besoin d’ERP lourds ou de SaaS fermés.  
Elles ont besoin d’un outil **sobre, moderne et maîtrisable**, que je construis pour elles.

### Mes principes
1. **Simplicité** : interface claire, parcours fluides, moins de clics.  
2. **Conformité native** : Factur-X, PDF/A-3, communication avec PDP intégrés au cœur de l’application.  
3. **Transparence et indépendance** : open-source, hébergeable, pas de dépendances cachées.  
4. **Architecture saine et évolutive** : modulaire, testable, facile à améliorer.  
5. **Focus utilisateur** : outil conçu pour ceux qui facturent, pas pour compliquer leur quotidien.  

### Différenciateur
- French-native et conforme à la réglementation française  
- Sobre et moderne, alternative crédible aux ERP lourds  
- Indépendant et open-source, pas de verrou propriétaire  

### Ambition
Faire d’eInvoicing un compagnon fiable et simple pour toutes les petites structures qui veulent rester en conformité, **sans complexité inutile**.  

---

## 🚀 Prochaines étapes

- Finaliser la conformité PDF/A-3 ISO 19005-3  
- Mise en place d’un environnement de staging simple et respectueux du RGPD  
- Améliorer les échanges avec les PDP via Swagger  
- Renforcer la couverture de tests et le monitoring  

---

## 📄 Licence

- MIT (ou équivalent) – partage pédagogique et possibilité de contributions

## 💡 Notes pédagogiques

- Chaque jour de développement est documenté en Markdown.  
- L’approche est itérative : un module complet → validation → passage au suivant.  
- L’objectif est autant **l’apprentissage** que la construction d’un outil **réel et robuste**.  
