# Jour 4 – Premier affichage des vendeurs : React rencontre Express 🚀⚛️

Aujourd’hui, j’ai passé la journée à connecter concrètement le frontend et le backend — une étape clé qui transforme enfin mon projet en une application « vivante ».  

## Mise en place du backend Express 🛠️

J’ai commencé par créer l’API REST permettant de récupérer la liste des vendeurs depuis ma base PostgreSQL.  
J’ai structuré mon code avec un découpage clair :  
- un modèle pour interroger la base, 
  ```js
  async function getAllSellers() {
    const result = await pool.query(
      `SELECT id, legal_name, legal_identifier, address, city, postal_code, country_code, 
              vat_number, registration_info, share_capital, bank_details, created_at, updated_at 
      FROM invoicing.sellers`
    );
    return result.rows;
  } 
  ```
- un service pour orchestrer la logique métier,  
  ```js
  async function listSellers() {
    return await SellersModel.getAllSellers();
  }
  ```
- un contrôleur pour gérer les requêtes HTTP,
  ```js
  async function getSellers(req, res) {
    try {
      const sellers = await SellersService.listSellers();
      res.json(sellers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }  
  ```
- une route pour exposer le point d’entrée `/api/sellers`.  
  ```js
  router.get('/', SellersController.getSellers);
  ```

C’était l’occasion de me plonger dans Express, de gérer les erreurs, et de vérifier que mes données remontaient bien via l’API.  
Après quelques ajustements (notamment le bon chemin des fichiers et la configuration CORS), le serveur tourne parfaitement sur le port 3000.

## Création du frontend avec React + Vite ⚛️✨

Côté frontend, j’ai utilisé Vite pour lancer un projet React moderne, léger et rapide.  
J’ai créé un composant React simple `SellersList` qui interroge mon API backend via un fetch sur `/api/sellers` (avec la configuration proxy dans Vite pour ne pas avoir de soucis de CORS).  

J’ai dû apprendre à gérer la syntaxe des modules, la distinction entre export par défaut et export nommé, ainsi qu’à utiliser React Router pour afficher ce composant à l’URL `/sellers`.  
C’était un premier vrai défi React, avec ses erreurs de parsing et d’import/export, mais cela m’a permis de mieux comprendre l’écosystème.

## Test et débogage 🔍🐞

L’étape suivante a été de faire communiquer correctement les deux serveurs :  
- Le backend sur le port 3000 qui expose l’API  
  ![](images/jour4/backend.png)

- Le frontend sur le port 5173 qui fait la requête via la proxy Vite  
  ![](images/jour4/frontend.png)

## Ce que j’ai appris 📚

- L’importance de structurer le backend pour garder un code clair et maintenable.  
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

