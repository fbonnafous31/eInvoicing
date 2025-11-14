#!/bin/bash
# 🚀 Installation eInvoicing (version clean)

# 1️⃣ Mise à jour des images
docker-compose pull

# 2️⃣ Reset complet
docker-compose down 
docker-compose up -d 

# 3️⃣ Attendre que PostgreSQL démarre
echo "⏳ Initialisation de la base..."
until docker exec einvoicing-db pg_isready -U einvoicing -d einvoicing_deploy; do
  echo "⏳ Attente de PostgreSQL..."
  sleep 2
done

# 4️⃣ Vérifie si la table 'invoices' existe, sinon charge la structure
docker exec einvoicing-db psql -U einvoicing -d einvoicing_deploy -c "\dt" | grep -q "invoices" || \
docker exec -i einvoicing-db psql -U einvoicing -d einvoicing_deploy -f /docker-entrypoint-initdb.d/einvoicing.sql >/dev/null

# 5️⃣ Création du dossier et du symlink pour les invoices
docker exec einvoicing-backend /bin/sh -c "mkdir -p /app/src/uploads/app && ln -sf /app/src/uploads/invoices /app/src/uploads/app/invoices"

echo "✅ eInvoicing est prêt : http://localhost:8080/"