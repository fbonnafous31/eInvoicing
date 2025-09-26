#!/bin/bash
# ===================================================
# Guide de démarrage eInvoicing
# ===================================================

# Récupère les dernières images
docker-compose pull

# Stoppe et supprime les conteneurs existants
docker-compose down

# Lancer tous les conteneurs
docker-compose up -d

# Chargement du dump DB (si DB vide)
docker-compose exec db psql -U einvoicing -d einvoicing_local -c "\dt" | grep -q "invoices" || docker-compose exec db psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql && echo "Restauration du dump SQL effectuée !"

# Copier le config.js dans le conteneur frontend afin d'injecter les variables d'environnement
docker cp frontend/config.js einvoicing-frontend:/usr/share/nginx/html/config.js

# Copier la configuration Nginx personnalisée dans le conteneur frontend.
# - Résout les problèmes CORS 
# - Gère le proxy vers /api/ pour le backend Node.js
# - Sert correctement les fichiers statiques dans /assets/ pour éviter les erreurs de type MIME
# - Permet le fallback SPA pour React (toutes les routes non existantes pointent vers index.html)
# - Gère l'accès aux fichiers uploadés via /uploads/
docker cp frontend/default.conf einvoicing-frontend:/etc/nginx/conf.d/default.conf

# Recharger Nginx pour prendre en compte le nouveau config.js
docker exec einvoicing-frontend nginx -s reload