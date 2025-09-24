# Fiche pratique – Docker images, conteneurs & CD 🐳🚀

## 1️⃣ Étapes pour créer une image Docker

### Se placer dans le dossier du projet

```bash
cd ~/dev/eInvoicing/backend
# ou
cd ~/dev/eInvoicing/frontend
```

### Créer le Dockerfile

#### Exemple backend (Node.js)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Exemple frontend (Nginx)

```dockerfile
FROM nginx:alpine
COPY ./dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Construire l’image Docker

```bash
docker build -t <nom_image>:<tag> .
# Exemple :
docker build -t einv-backend-cd:local .
docker build -t einv-frontend-cd:local .
```

---

## 2️⃣ Lancer un conteneur

### Exécuter le conteneur en détaché avec mapping de ports

```bash
docker run -d -p <port_local>:<port_conteneur> --name <nom_conteneur> <nom_image>:<tag>
# Exemple backend
docker run -d -p 3001:3000 --name einv-backend-cd einv-backend-cd:local
# Exemple frontend
docker run -d -p 8080:80 --name einv-frontend-cd einv-frontend-cd:local
```

### Vérifier que les conteneurs tournent

```bash
docker ps
```

### Voir les logs en direct

```bash
docker logs -f <nom_conteneur>
# Exemple
docker logs -f einv-backend-cd
docker logs -f einv-frontend-cd
```

### Accéder à un conteneur en shell

```bash
docker exec -it <nom_conteneur> sh
```

### Arrêter et supprimer un conteneur

```bash
docker stop <nom_conteneur>
docker rm <nom_conteneur>
```

### Supprimer toutes les images ou conteneurs inutilisés

```bash
docker image prune -a
docker container prune
```

---

## 3️⃣ Push et utilisation avec GitHub Container Registry (GHCR)

### 1. Taguer l’image pour GHCR

```bash
docker tag einv-backend-cd:local ghcr.io/<ton_user>/e-invoicing-backend:latest
docker tag einv-frontend-cd:local ghcr.io/<ton_user>/e-invoicing-frontend:latest
```

### 2. Se connecter à GHCR avec un Personal Access Token

```bash
echo <TON_PERSONAL_ACCESS_TOKEN> | docker login ghcr.io -u <ton_user> --password-stdin
```

### 3. Pousser l’image

```bash
docker push ghcr.io/<ton_user>/e-invoicing-backend:latest
docker push ghcr.io/<ton_user>/e-invoicing-frontend:latest
```

### 4. Vérifier que l’image est sur GHCR

* Depuis le navigateur : `https://github.com/<ton_user>?tab=packages`
* Ou avec `docker pull` :

```bash
docker pull ghcr.io/<ton_user>/e-invoicing-backend:latest
docker pull ghcr.io/<ton_user>/e-invoicing-frontend:latest
```

---

## 4️⃣ Vérifications locales après push

* Lancer le backend distant pour tester le package :

```bash
docker run -p 3000:3000 --rm ghcr.io/<ton_user>/e-invoicing-backend:latest
```

* Vérifier que la route `/health` répond :

```bash
curl http://localhost:3000/health
```

* Vérifier que le frontend se connecte bien au backend et charge les pages.

---

## 5️⃣ Astuces CI/CD que nous avons testées

* Workflow GitHub Actions minimal pour **build et push Docker** :

  * Sur push sur `main` ou tags `v*`
  * Steps : checkout → setup Docker → build frontend → build backend → push GHCR
  * Tag automatique (`latest` et short SHA)

* Avantage : une fois push sur `main`, GitHub Actions build automatiquement tes images et les pousse sur GHCR.

* Pour tester rapidement, tu peux **tirer l’image distante et la lancer localement**, ce qui permet de valider la CD sans toucher à la prod.

---

## 6️⃣ Conseils

* Vérifie que tous les fichiers nécessaires sont dans l’image Docker (notamment `config/db.js` pour le backend).
* Utilise des **variables d’environnement** pour la DB et Auth0 plutôt que de hardcoder les secrets.
* Toujours tester en local avec Docker avant de pousser : tu peux simuler un **environnement de staging local**.
* Nettoie régulièrement les conteneurs et images inutilisés pour é
