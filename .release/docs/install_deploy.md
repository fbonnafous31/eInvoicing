# 🚀 Guide d'installation eInvoicing (local)

Ce guide explique comment déployer l'architecture complète d'eInvoicing
en local à l'aide de Docker.

------------------------------------------------------------------------

## 1️⃣ Déployer l'architecture

Structure attendue du projet :

    .
    ├── architecture.txt
    ├── backend
    │   ├── .env
    │   └── Dockerfile
    ├── frontend
    │   ├── config.js
    │   ├── default.conf
    │   └── Dockerfile
    ├── scripts
    │   └── einvoicing.sql
    ├── docker-compose.yml
    └── start-einvoicing.sh

------------------------------------------------------------------------

## 2️⃣ Initialiser les variables d'environnement (backend)

Créer le fichier `backend/.env` avec les variables suivantes :

``` bash
# Configuration base de données
NODE_ENV=development
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=
DB_SSL=false
PORT=

# Auth0
AUTH0_DOMAIN=
AUTH0_AUDIENCE=

# PDP (mock ou adaptateur)
PDP_BASE_URL=
PDP_AUTH_URL=
PDP_CLIENT_ID=
PDP_CLIENT_SECRET=

# Encryption key (32 bytes minimum)
ENCRYPTION_KEY=

# Resend configuration (envoi de mail)
RESEND_API_KEY=

# Storage backend configuration 
STORAGE_BACKEND=  # options: local, b2
B2_ENDPOINT=
B2_BUCKET_NAME=
B2_KEY_ID=
B2_APPLICATION_KEY=
```

🟡 **Remarque** :\
- Si tu utilises le mock PDP local, seule `PDP_BASE_URL` est
nécessaire.\
- Si tu connectes l'adaptateur PDP réel, configure les 4 variables
correspondantes.

## 2bis️⃣ Installer Ollama et télécharger le modèle LLaMA3

Avant de lancer le backend, installez Ollama et le modèle LLaMA3 sur votre machine locale (backend).

```bash
# Installer Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Vérifier l'installation
ollama --version

# Télécharger le modèle LLaMA3
ollama pull llama3

# Tester en ligne de commande
ollama run llama3

------------------------------------------------------------------------

## 3️⃣ Initialiser les variables de configuration (frontend)

Créer le fichier `frontend/config.js` :

``` js
// Fichier JS pur, servi par Nginx, utilisé par le frontend pour les variables runtime
window.__ENV__ = {
  // URL du backend (container ou hôte)
  VITE_API_URL: '',
  VITE_APP_URL: '',

  // Variables Auth0 du client
  VITE_AUTH0_DOMAIN: '',   
  VITE_AUTH0_CLIENT_ID: '',
  VITE_AUTH0_AUDIENCE: '' 

  // Plateforme agréée
  VITE_PDP_PROVIDER: 'mock'
};
```

------------------------------------------------------------------------

## 4️⃣ Initialiser Docker Compose

S'assurer que le fichier `docker-compose.yml` est présent à la racine du
projet et correctement configuré :

``` bash
docker-compose config
```

✅ Cette commande permet de vérifier que tous les services et volumes
sont valides avant le lancement.

------------------------------------------------------------------------

## 5️⃣ Lancer le script de déploiement

Le script `start-einvoicing.sh` (ou `deploy.sh`) orchestre l'ensemble du
déploiement :

``` bash
#!/bin/bash
# ===================================================
# Guide de démarrage eInvoicing
# ===================================================

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Abandon."
    exit 1
fi

# Récupère les dernières images
docker-compose pull

# Stoppe et supprime les conteneurs existants
docker-compose down

# Lancer tous les conteneurs
docker rm -f einvoicing-db einvoicing-backend einvoicing-frontend 2>/dev/null || true
docker-compose up -d

# Attendre quelques secondes que la DB et le backend démarrent
echo "Attente du démarrage des services..."
sleep 5

# Charger le dump SQL si nécessaire
# ⚠️ Renommer einvoicing_local par le nom de la DB
docker exec einvoicing-db psql -U einvoicing -d einvoicing_local -c "\\dt" | grep -q "invoices" || \
docker exec -i einvoicing-db psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql

# Copier config.js et Nginx personnalisé dans le frontend
docker cp frontend/config.js einvoicing-frontend:/usr/share/nginx/html/config.js
docker cp frontend/default.conf einvoicing-frontend:/etc/nginx/conf.d/default.conf

# Recharger Nginx
docker exec einvoicing-frontend nginx -s reload

# Création du dossier et du symlink pour les invoices
docker exec einvoicing-backend /bin/sh -c "mkdir -p /app/src/uploads/app && ln -sf /app/src/uploads/invoices /app/src/uploads/app/invoices"

# Test rapide de l'API backend
echo "Test de l'API backend :"
curl -s -o /dev/null -w "HTTP STATUS: %{http_code}\n" http://localhost:3000/health

# Accès à l'app en local
# http://localhost:8080
```

Exécuter le script :

``` bash
chmod +x start-einvoicing.sh
./start-einvoicing.sh
```

------------------------------------------------------------------------

## 6️⃣ Vérifier l'installation

  ------------------------------------------------------------------------------------------------------------------------------
  Élément             Commande / URL                                                                        Attendu
  ------------------- ------------------------------------------------------------------------------------- --------------------
  **Base de données** ` "`   Liste des tables

  **Backend**         <http://localhost:3000/health>                                                        `HTTP STATUS: 200`

  **Frontend**        <http://localhost:8080>                                                               Application
                                                                                                            eInvoicing en ligne
  ------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

✅ **Installation terminée !**

Ton environnement eInvoicing est maintenant opérationnel en local 🎉