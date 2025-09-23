# Jour 83 – CD frontend & backend 🎯🐳

Aujourd’hui, on a avancé sur la **Continuous Deployment (CD)** du projet **eInvoicing**, côté frontend et backend, avec Docker et GitHub Container Registry (GHCR).  

## Ce qu’on a fait **en local** ✅

### Backend
* On a construit l’image Docker du backend (`test-backend:latest`).  
* On a vérifié que **tous les fichiers essentiels sont présents**, notamment `src/config/db.js`.  
* On a testé le container local : `/health` fonctionne, les routes API sont prêtes.  
* On a géré les **conflits de ports** et les fichiers sensibles (`.env`) via `process.env`.  

### Frontend
* Build Vite + React fonctionnel en local.  
* On a créé l’image Docker du frontend avec **Nginx** pour servir les fichiers statiques.  
* Vérification locale : l’interface se lance, tout est bien compilé.  

> 💡 Astuce : toujours tester les images localement avant de les pousser, ça évite les surprises.

## Ce qu’on a fait côté **GitHub / GHCR** ✅

* Push des images frontend et backend sur GHCR :  
  * `ghcr.io/fbonnafous31/e-invoicing-backend:latest`  
  * `ghcr.io/fbonnafous31/e-invoicing-frontend:latest`  
* Création d’un **Personal Access Token** avec le scope `write:packages` pour Docker.  
* Vérification : les images GHCR correspondent aux images locales, fichiers clés présents.  
* Résolution des petits soucis classiques : login GHCR, ports déjà pris, fichiers sensibles non versionnés.  

## Ce qui fonctionne maintenant 🌟

* **Images Docker frontend et backend testées localement** ✅  
* **Images GHCR prêtes à être utilisées dans CD** ✅  
* CI/CD peut **reconstruire et pousser automatiquement** les images sans perte de fichiers.  
* Les fichiers sensibles (DB, secrets) sont gérés via **variables d’environnement**, plus de problème de `.gitignore`.  

## Prochaines étapes 📌

1. Intégrer les images dans le **pipeline CD GitHub Actions** pour déploiement automatisé.  
2. Tester le **déploiement complet** (frontend + backend).  
3. Ajouter les **secrets DB dans GitHub Actions** pour un build sécurisé.  
4. Vérifier que tous les endpoints API fonctionnent depuis GHCR.  
