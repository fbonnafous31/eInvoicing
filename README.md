# eInvoicing

## Description

eInvoicing est une application web destinée à faciliter la gestion et l’intégration des factures électroniques fournisseurs dans un système ERP. Le projet vise à fournir une interface simple pour saisir les données essentielles des factures, stocker ces informations dans une base PostgreSQL structurée, et permettre la génération de documents standardisés au format XML.

---

## Objectifs

- Permettre la saisie intuitive des factures fournisseurs via une interface web.
- Assurer une gestion fiable et évolutive des données grâce à PostgreSQL.
- Préparer la génération de factures au format XML conforme aux standards.
- Poser les bases d’un PDP (Plateforme de Dématérialisation Partagée) en mode agile.

---

## Technologies

- **Backend** : Node.js (en développement)
- **Base de données** : PostgreSQL
- **Interface graphique** : (à définir, exemples possibles : React, Vue.js)
- **Outil de gestion base** : DBeaver
- **Environnement de développement** : VSCode sous Ubuntu

---

## Structure de la base de données

La base comprend les tables principales suivantes :

- `sellers` : informations légales et bancaires des vendeurs.
- `buyers` : informations légales des acheteurs.
- `invoices` : données générales des factures.
- `invoice_lines` : détail des lignes de factures.
- `invoice_taxes` : ventilation des taxes appliquées.

---

## Installation & Démarrage

1. Installer PostgreSQL et créer la base `einvoicing`.
2. Importer le script SQL des tables dans la base.
3. Configurer la connexion à la base dans le backend Node.js.
4. Lancer l’application frontend (à venir).

---

## Contribution

Contributions bienvenues ! Merci d’ouvrir des issues ou proposer des pull requests.

---

## Licence

Projet open-source - à définir.

---

*Ce README sera mis à jour au fil du développement.*

