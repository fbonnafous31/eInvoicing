#!/bin/bash
# ===================================================
# 🚀 Installation eInvoicing (version clean)
# ===================================================

# 1️⃣ Mise à jour des images
docker-compose pull

# 2️⃣ Reset complet
docker-compose down # -v supprime aussi le volume pgdata
docker rm -f einvoicing-db einvoicing-backend einvoicing-frontend 2>/dev/null || true
docker-compose up -d 

# 3️⃣ Attendre que PostgreSQL démarre
echo "⏳ Initialisation de la base..."
sleep 10

# 4️⃣ Vérifie si la table 'invoices' existe, sinon charge la structure
# ⚠️ Renommer einvoicing_local par le nom de la DB
docker exec einvoicing-db psql -U einvoicing -d einvoicing_local -c "\\dt" | grep -q "invoices" || \
docker exec -i einvoicing-db psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql

# 5️⃣ Configuration frontend
docker cp frontend/config.js einvoicing-frontend:/usr/share/nginx/html/config.js
docker cp frontend/default.conf einvoicing-frontend:/etc/nginx/conf.d/default.conf
docker exec einvoicing-frontend nginx -s reload
