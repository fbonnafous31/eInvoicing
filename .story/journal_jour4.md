# Jour 4 – Premier affichage des vendeurs : React rencontre Express 🚀⚛️

Aujourd’hui, j’ai passé la journée à connecter concrètement le frontend et le backend — une étape clé qui transforme enfin mon projet en une application « vivante ».  

## Mise en place du backend Express 🛠️

J’ai commencé par créer l’API REST permettant de récupérer la liste des vendeurs depuis ma base PostgreSQL.  
J’ai structuré mon code avec un découpage clair :  
- un modèle pour interroger la base,  
- un service pour orchestrer la logique métier,  
- un contrôleur pour gérer les requêtes HTTP,  
- une route pour exposer le point d’entrée `/api/sellers`.  

C’était l’occasion de me replonger dans Express, de gérer les erreurs, et de vérifier que mes données remontaient bien via l’API.  
Après quelques ajustements (notamment le bon chemin des fichiers et la configuration CORS), le serveur tourne parfaitement sur le port 3000.

## Création du frontend avec React + Vite ⚛️✨

Côté frontend, j’ai utilisé Vite pour lancer un projet React moderne, léger et rapide.  
J’ai créé un composant React simple `SellersList` qui interroge mon API backend via un fetch sur `/api/sellers` (avec la configuration proxy dans Vite pour ne pas avoir de soucis de CORS).  

J’ai dû apprendre à gérer la syntaxe des modules, la distinction entre export par défaut et export nommé, ainsi qu’à utiliser React Router pour afficher ce composant à l’URL `/sellers`.  
C’était un premier vrai défi React, avec ses erreurs de parsing et d’import/export, mais cela m’a permis de mieux comprendre l’écosystème.

## Test et débogage 🔍🐞

L’étape suivante a été de faire communiquer correctement les deux serveurs :  
- Le backend sur le port 3000 qui expose l’API  
- Le frontend sur le port 5173 qui fait la requête via la proxy Vite  

J’ai découvert qu’il fallait impérativement que le backend soit lancé avant le frontend pour éviter les erreurs de connexion refusée.  

## Ce que j’ai appris 📚

- L’importance de structurer le backend pour garder un code clair et maintenable.  
- Les subtilités du CORS et comment Vite facilite la vie avec sa configuration proxy.  
- La différence entre exports par défaut et exports nommés en ES Modules React.  
- Le workflow classique du développeur fullstack : lancer deux serveurs distincts et s’assurer qu’ils communiquent bien.  

## Prochaines étapes 🎯

Pour demain, je vais :  
- Continuer à développer l’interface utilisateur avec React, notamment ajouter des détails sur chaque vendeur.  
- Ajouter des fonctionnalités côté backend pour gérer l’ajout et la modification des vendeurs.  
- Explorer les bonnes pratiques pour le développement simultané front/back (scripts automatisés, outils comme `concurrently`).  

---

Ce premier affichage fonctionnel est une belle victoire et me donne une bonne énergie pour la suite.  
Chaque petit bout de code ajouté rapproche le projet de son objectif : une application complète, utile, et bien pensée.

