# Jour 10 – Les clients entrent en scène 🧑‍💼

Aujourd’hui, j’ai ajouté une **nouvelle entité clé** dans le projet : les **clients**.  
C’est une étape importante, car jusqu’ici tout le flux de facturation ne tournait qu’autour des vendeurs. Désormais, on peut gérer les deux acteurs principaux du processus.

---

## 🎯 Objectif  
Mettre en place **le CRUD complet pour les clients**, en s’appuyant sur l’architecture déjà existante pour les vendeurs.  
Plutôt que de tout recoder, j’ai choisi un raccourci assumé : **copier-coller le module “vendeur” et l’adapter**.  
Pas une bonne pratique universelle, mais ici la structure étant identique, c’était le moyen le plus rapide de progresser.

---

## 🛠 Côté backend  

- **Création de la table `clients`** en base PostgreSQL, calquée sur celle des vendeurs (mêmes colonnes, mêmes contraintes).  
- Duplication du dossier `backend/src/modules/sellers` en `backend/src/modules/clients` puis **remplacement méthodique** de tous les `seller` → `client` (noms de variables, fonctions, routes).  
- Mise à jour des **routes API** :  
  - `/api/clients` pour la liste et la création.  
  - `/api/clients/:id` pour lecture, mise à jour et suppression.  
- Petites corrections en chemin :
  - Suppression d’une virgule en trop dans un `UPDATE` qui faisait planter PostgreSQL.  
  - Harmonisation des paramètres `$n` pour éviter le fameux `could not determine data type of parameter $8`.  

---

## 💻 Côté frontend  

- Duplication du dossier `frontend/src/pages/sellers` en `frontend/src/pages/clients`.  
- Adaptation des composants :
  - `ClientsList` pour l’affichage de la liste.
  - `NewClient` pour la création.
  - `ClientDetail` pour la fiche individuelle.
- Mise à jour des appels API (`/api/sellers` → `/api/clients`).  
- Ajout des **routes React** dans `App.jsx` pour accéder aux écrans clients.  
- Intégration d’un lien “Clients” dans la barre de navigation.

---

## 📚 Ce que j’ai appris  

- **Copier-coller peut être efficace**… à condition d’être rigoureux dans les renommages et cohérent dans les API.  
- Les erreurs de type PostgreSQL (`syntax error near updated_at`, `$n` manquant) sont souvent liées à un simple décalage entre les placeholders et les valeurs passées.  
- Une fois le backend solide, **le frontend se met en place très vite** en réutilisant les mêmes patterns.

---

## 🚀 Prochaines étapes  

- Relier vendeur et client dans la création de facture (sélection des deux acteurs).  
- Consolider les validations (SIRET et autres champs) côté client.  
- Poursuivre l’UX pour naviguer de façon fluide entre vendeurs, clients et factures.  
