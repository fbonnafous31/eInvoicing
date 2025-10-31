# Jour 134 – Refacto multi-environnements et variable DB_SCHEMA 🛠🌱

Aujourd’hui, l’objectif était de **rendre mon backend indépendant du schéma de la DB**, afin de pouvoir exploiter pleinement la DB payante et gérer plusieurs environnements facilement.

---

## 🔧 Variable d’environnement DB_SCHEMA

Pour éviter de **hardcoder le nom des schémas**, j’ai ajouté la variable d’environnement `DB_SCHEMA` :

* Définie dans `.env` : `DB_SCHEMA=invoice_staging` ou `invoice_prod`.
* Tous les modèles et requêtes SQL utilisent désormais `${SCHEMA}` au lieu d’un nom fixe.
* Les tables restent les mêmes (`clients`, `invoice_attachments`, etc.) mais avec le **schéma dynamique**.

> Objectif : changer d’environnement simplement sans toucher au code. Un switch rapide entre staging, preprod et production.

---

## 🖥 Refacto des composants

Le refacto a concerné **tous les composants principaux** :

* **Clients** : plus de `Client.table_name`, toutes les requêtes utilisent `${SCHEMA}.clients`.
* **Invoices** : modèles `invoiceAttachments` et `invoiceStatus` adaptés pour prendre en compte le schéma dynamique.
* **Sellers** : mise à jour du composant pour rester cohérent avec l’approche multi-schéma.
* **Tests** : tous les tests unitaires et mocks ont été adaptés pour accepter la variable `${SCHEMA}`.

> Résultat : un code **plus propre, découplé et modulable**, prêt à accueillir plusieurs environnements sans duplication.

---

## ✨ Avancées concrètes

| Élément              | Avancée                                  | Impact                                                 |
| -------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Variable DB_SCHEMA   | ✅ Ajoutée dans `.env`                    | Schéma dynamique selon l’environnement                 |
| Clients & Invoices   | ✅ Refacto des modèles                    | Plus de dépendance aux noms de schéma fixes            |
| Tests unitaires      | ✅ Adaptés aux schémas dynamiques         | Passent sur tous les environnements                    |
| Multi-environnements | ✅ Staging, preprod, production possibles | Un seul codebase et une seule DB pour plusieurs usages |

---

## 💡 Bilan du jour

Jour 134 est consacré à **la modularité et la maintenabilité** :

* Le code n’est plus couplé à un schéma spécifique.
* Passer d’un environnement à l’autre est maintenant **transparent** grâce à `DB_SCHEMA`.
* L’architecture est prête pour accueillir de nouveaux environnements ou tester des fonctionnalités sans risque pour les données existantes.

> Une étape clé pour continuer à **scaler proprement** et sécuriser le projet avant de lancer de nouveaux tests ou fonctionnalités. 🚀
