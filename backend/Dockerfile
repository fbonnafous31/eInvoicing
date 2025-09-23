# Utiliser Node 20 pour cohérence avec le frontend
FROM node:20-alpine

# Répertoire de travail dans le conteneur
WORKDIR /app

# Copier uniquement package.json et package-lock.json pour optimiser le cache
COPY package*.json ./

# Installer les dépendances (production seulement)
RUN npm install --production

# Copier tout le code source
COPY . .

# Exposer le port sur lequel ton serveur écoute
EXPOSE 3000

# Définir la commande de démarrage
CMD ["node", "server.js"]
