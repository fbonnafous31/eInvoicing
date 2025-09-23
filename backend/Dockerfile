# Utiliser l'image Node officielle
FROM node:18-alpine

# Définir le dossier de travail
WORKDIR /app

# Copier uniquement package.json et package-lock.json pour installer les dépendances d'abord (cache Docker)
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier tout le reste du code (src, constants, server.js, etc.)
COPY . .

# Exposer le port utilisé par le backend
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
