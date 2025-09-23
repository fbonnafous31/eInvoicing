FROM node:18-alpine

# Répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances
RUN npm install --production

# Copier tout le code
COPY . .

# Exposer le port
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
