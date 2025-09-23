# frontend/Dockerfile

# --- 1. Build étape (Node) ---
FROM node:20-alpine AS build
WORKDIR /app

# Copier uniquement package.json et lockfile pour profiter du cache Docker
COPY package*.json ./

# Installer toutes les dépendances nécessaires au build
RUN npm install

# Copier le reste du code source
COPY . .

# Construire l'application
RUN npm run build

# --- 2. Serveur prod avec Nginx ---
FROM nginx:alpine AS prod
# Supprimer le contenu par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copier le build Vite dans le dossier servable par Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copier un fichier de config Nginx custom si besoin
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80 pour accéder au frontend
EXPOSE 80

# Commande par défaut pour lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
