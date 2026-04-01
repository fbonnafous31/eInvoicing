#!/bin/bash
# ===================================================
# 🚀 Déploiement eInvoicing (version simplifiée)
# ===================================================

set -e  # Stop le script si une commande échoue

echo "🟢 Début du déploiement eInvoicing..."

# ------------------------
# 1️⃣ Mise à jour des images
# ------------------------
echo "⏳ Pull des dernières images Docker..."
docker-compose pull

# ------------------------
# 2️⃣ Reset complet des containers
# ------------------------
echo "⏳ Arrêt et suppression des containers existants..."
docker-compose down --remove-orphans

# ------------------------
# 3️⃣ Démarrage des services
# ------------------------
echo "⏳ Lancement des containers..."
docker-compose up -d

# ------------------------
# 4️⃣ Attente que PostgreSQL soit prêt
# ------------------------
echo "⏳ Attente de PostgreSQL..."
until docker exec einvoicing-db pg_isready -U einvoicing_fb_user -d einvoicing_fb >/dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL prêt"

# ------------------------
# 5️⃣ Préparer le dossier uploads
# ------------------------
echo "⏳ Création des dossiers uploads et symlink..."

docker exec backend /bin/sh -c "
  mkdir -p /app/src/uploads/invoices || true
  mkdir -p /app/src/uploads/app || true

  if [ ! -L /app/src/uploads/app/invoices ]; then
    ln -s /app/src/uploads/invoices /app/src/uploads/app/invoices
  fi
"

echo "✅ Dossiers uploads prêts"

# ------------------------
# 6️⃣ Vérification du backend
# ------------------------
echo "⏳ Vérification du backend..."
until curl -s http://localhost:3000/health | grep -q ok; do
  sleep 2
done
echo "✅ Backend opérationnel"

# ------------------------
# 7️⃣ Message final
# ------------------------
echo "🎉 eInvoicing est prêt !"
echo "Frontend : http://localhost:8080/"
echo "Backend : http://localhost:3000/"