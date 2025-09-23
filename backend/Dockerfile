FROM node:20-alpine

WORKDIR /app

# Copier package.json pour installer dépendances
COPY package*.json ./
RUN npm install --production

# Copier dossiers root nécessaires
COPY ./constants /app/constants
COPY ./src/config /app/config

# Copier le reste du code
COPY ./src /app/src
COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]
