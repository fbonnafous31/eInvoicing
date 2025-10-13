# Backend Node.js pour eInvoicing
FROM node:18

# Définir le dossier de travail
WORKDIR /app

# Copier package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source complet
COPY . .

# Exposer le port utilisé par le backend
EXPOSE 3000

# Lancer le backend
CMD ["node", "src/index.js"]
