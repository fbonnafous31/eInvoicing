# Jour 85 – Initialisation automatique de la DB et procédure de démarrage 🐳💾

Aujourd’hui, j’ai travaillé sur la mise en place d’une procédure de démarrage simple et reproductible pour eInvoicing, en particulier sur la base de données PostgreSQL.

## 🔹 Objectif du jour

- Avoir une procédure claire et rapide pour démarrer l’environnement complet : backend, frontend et DB.  
- Permettre la restauration automatique du dump SQL de la base lors de la première installation.  
- Réduire les interventions manuelles nécessaires pour tester l’application localement.  

## 🔹 Étapes réalisées

### 1️⃣ Analyse des problèmes d’automatisation

- L’utilisation de `docker-entrypoint-initdb.d` avec un dump SQL ne fonctionnait pas toujours si le volume persistait (`pgdata`).  
- Les scripts shell initiaux étaient exécutés **une seule fois** à la création du container, ce qui empêche de forcer la restauration sur un démarrage déjà existant.  
- Vérification : `SET search_path TO invoicing; \dt` dans `psql` ne pouvait pas s’exécuter directement via `docker-compose exec db` à cause de la syntaxe des commandes psql vs shell.  

### 2️⃣ Solution retenue

Créer un script **bash de démarrage manuel** pour restaurer le dump quand nécessaire :

```bash
#!/bin/bash
docker-compose up -d
docker-compose exec db bash
psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql
```

- Ce script sert de guide rapide pour tester l’application ou repartir d’une base fraîche.  
- Stockage du script sous le nom : **start-einvoicing-guide.sh** pour référence et simplicité.  

### 3️⃣ Test complet local

- Démarrage via `docker-compose up -d` → backend et frontend **OK**.  
- Restauration manuelle du dump SQL → tables dans le schema `invoicing` bien présentes.  
- Vérification endpoints :  
  - Backend `/health` → **OK**  
  - Frontend sur `http://localhost:8080` → interface accessible  

### 4️⃣ Points clés appris

- Volumes Docker persistants empêchent la réinitialisation automatique des données : il faut gérer la restauration via script ou supprimer le volume.  
- La procédure manuelle reste simple et fiable, surtout pour le développement local.  
- **Important** : séparer le dump et le script de restauration pour pouvoir contrôler quand et comment la DB est restaurée.  

## 🔹 Prochaines étapes

- Étendre le guide de démarrage pour inclure **Prometheus** et **Grafana** si nécessaire.  
- Automatiser la restauration conditionnelle du dump selon l’état du volume, pour simplifier l’installation sur une machine vierge.  
- Documenter la procédure complète de démarrage local dans le `README` du projet.  
- Intégrer éventuellement la restauration DB dans le pipeline **CD** pour tests automatisés.  

💡 Aujourd’hui, nous avons donc posé une procédure de démarrage fiable pour eInvoicing, avec base de données restaurée, backend et frontend opérationnels, prête à être utilisée par n’importe quel développeur ou pour les tests locaux.  