# Utiliser Node.js officiel
FROM node:18-alpine

# Répertoire de travail dans le container
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances
RUN npm install --production

# Copier tout le code (src + server.js + constants + autres fichiers)
COPY . .

# Exposer le port de l'API
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
