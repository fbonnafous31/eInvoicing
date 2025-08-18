# Jour 19 – Services API et centralisation des appels 💾⚡

Aujourd’hui, j’ai consacré ma session à **centraliser tous les appels API** du projet.  
Objectif : simplifier le code frontend, éviter la duplication et préparer une base solide pour la maintenance et l’évolution des entités.

---

## 🎯 Pourquoi un service centralisé ?

Avant, chaque page ou formulaire appelait directement `fetch` avec l’URL correspondante.  
Problème :  

- Si l’URL change ou si je dois ajouter un en-tête commun (authentification, content-type…), il fallait modifier chaque page.  
- La logique de récupération et de traitement des données était dispersée.  
- La réutilisation était limitée : créer un nouveau composant nécessitait souvent de réécrire les mêmes appels.

Avec un **service dédié par entité** (`sellers.js`, `clients.js`, `invoices.js`) :

- Tous les appels API sont regroupés en un seul endroit.  
- Les pages et composants consomment ces services sans se soucier des détails de l’URL ou des méthodes HTTP.  
- Il devient facile de gérer les erreurs, la mise en cache, ou d’ajouter un middleware plus tard.

---

## 💻 Côté frontend

### Adaptation des listes et formulaires

- `SellersList` et `NewSeller` utilisent désormais `sellersService` pour **fetcher ou créer un vendeur**.  
- `ClientsList` et `NewClient` utilisent `clientsService` de la même façon.  
- `InvoicesList` et `NewInvoice` passent par `invoicesService`.  

Les pages sont **plus légères et claires** : elles se concentrent sur l’UI, les formulaires et la logique d’état, sans gérer les détails du réseau.

### Breadcrumb et SEO

- Chaque page garde son **breadcrumb dynamique**, aligné à gauche pour les fiches.  
- Les titres H1 sont invisibles (`visually-hidden`) pour **SEO et accessibilité**, sans encombrer l’interface.  
- Les pages listes n’affichent plus un H2 redondant : le breadcrumb suffit à situer l’utilisateur.

---

## 🛠 Côté architecture

- `services/` contient maintenant un fichier par entité : chaque service exporte des fonctions `getAll`, `getById`, `create`, `update`, `delete`.  
- `constants/` permet de **centraliser les URLs** de l’API.  
- `AppRoutes.jsx` continue de gérer les routes, mais les composants sont **découplés du backend**.  
- La structure est plus modulable : ajouter une nouvelle entité demande seulement de créer son service et ses pages, sans toucher aux autres composants.

---

## 🔍 Résultats et apprentissages

- Le code est **plus propre et maintenable**.  
- Les erreurs et success messages restent gérés côté page, mais les appels réseau sont uniformisés.  
- Centraliser les services permet d’anticiper des améliorations comme **authentification, logging, retries ou tests unitaires**.  
- L’expérience de développement devient **plus rapide et cohérente**.

---

## 🌿 Réflexions autour du produit

- Même pour un projet solo, **structurer les appels API** est un vrai gain de temps.  
- Cette approche favorise **la réutilisation**, la cohérence et la préparation à de futures évolutions.  
- L’utilisateur ne voit rien de tout ça, mais moi je gagne en sérénité et en rapidité de développement.  
- Une petite étape côté architecture qui simplifie **toutes les prochaines pages et formulaires**.

---

## 🚀 Prochaines étapes

- Travailler sur la **qualité du code** et l’optimisation des services.  
- Adapter la **gestion des clients** pour distinguer les **entreprises des particuliers**, avec éventuellement des champs et validations spécifiques.  
- Ajouter des tests unitaires pour les services afin de garantir que les API répondent comme attendu.  
- Préparer la même approche si de nouvelles entités apparaissent : quelques lignes suffisent pour connecter la page au service.  

✅ Résultat : le projet est désormais **plus modulaire, maintenable et prêt à grandir**, tout en conservant
