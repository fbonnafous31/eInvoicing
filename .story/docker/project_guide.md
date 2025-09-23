# Fiche pratique – Docker images & conteneurs 🐳

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

### Arrêter un conteneur

```bash
docker stop <nom_conteneur>
```

### Supprimer un conteneur

```bash
docker rm <nom_conteneur>
```

---

## 3️⃣ Commandes utiles supplémentaires

### Supprimer toutes les images inutilisées

```bash
docker image prune -a
```

### Supprimer tous les conteneurs arrêtés

```bash
docker container prune
```

### Accéder à un conteneur en shell

```bash
docker exec -it <nom_conteneur> sh
```

### Reconstruire une image et relancer le conteneur

```bash
docker build -t einv-backend-cd:local .
docker stop einv-backend-cd
docker rm einv-backend-cd
docker run -d -p 3001:3000 --name einv-backend-cd einv-backend-cd:local
```
