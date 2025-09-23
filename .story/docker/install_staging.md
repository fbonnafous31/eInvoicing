# Fiche pratique – CD & staging local pour eInvoicing 🐳

Cette fiche décrit comment gérer la **Continuous Deployment** et un **environnement de staging local**, avec tout ce qu'il reste à configurer manuellement.

---

## 1️⃣ Variables d'environnement

### Backend

```bash
DB_USER=mon_user
DB_PASSWORD=mon_mdp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eInvoicing
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
```

### Frontend

```bash
VITE_AUTH0_DOMAIN=...
VITE_AUTH0_CLIENT_ID=...
API_URL=http://localhost:3000
```

> Les secrets doivent rester sécurisés et **ne pas être versionnés**.

---

## 2️⃣ Base de données PostgreSQL

1. Créer la DB et les tables

```sql
CREATE DATABASE eInvoicing;
-- puis exécuter les scripts SQL ou migrations
```

2. Insérer les données initiales si nécessaire (ex: comptes test, clients).
3. Vérifier la connexion depuis le backend.

---

## 3️⃣ Docker – images et conteneurs

### Construire les images

```bash
# Backend
docker build -t e-invoicing-backend:local ./backend
# Frontend
docker build -t e-invoicing-frontend:local ./frontend
```

### Lancer un conteneur en local

```bash
# Backend
docker run -d -p 3000:3000 --name einv-backend e-invoicing-backend:local
# Frontend
docker run -d -p 8080:80 --name einv-frontend e-invoicing-frontend:local
```

### Accéder au conteneur

```bash
docker exec -it <nom_conteneur> sh
# Exemple : docker exec -it einv-backend sh
```

### Logs

```bash
docker logs -f <nom_conteneur>
```

### Arrêter et supprimer

```bash
docker stop <nom_conteneur>
docker rm <nom_conteneur>
```

---

## 4️⃣ Staging local

1. Créer un **répertoire séparé** pour le staging.
2. Créer un `docker-compose.yml` utilisant les **images Docker distantes** (GHCR ou Docker Hub).
3. Définir les **variables d'environnement** dans `.env` ou directement dans `docker-compose.yml`.
4. Monter les volumes pour persister les fichiers et les uploads.
5. Lancer le staging

```bash
docker-compose up -d
```

6. Tester les endpoints et l’interface frontend.

> L’objectif est de reproduire **fidèlement l’environnement de production**.

---

## 5️⃣ Checklist post-déploiement

* Vérifier `/health` backend
* Tester `/api/sellers`, `/api/clients` etc.
* Vérifier la connexion à la DB
* Vérifier Auth0 et les droits utilisateurs
* Vérifier que les fichiers uploadés sont accessibles
* Contrôler les logs pour détecter toute erreur

---

## 6️⃣ Conseils pratiques

* **Documenter toutes les étapes manuelles** (DB, Auth0, secrets).
* **Garder le staging séparé** du projet principal pour éviter toute confusion.
* **Versionner uniquement le code et Dockerfiles**, pas les secrets.
* **Tester régulièrement le staging** pour valider que la CD produit bien des images fonctionnelles.

---

> Cette fiche permet de garder un **référentiel clair** pour le déploiement et le staging local de ton projet eInvoicing.
