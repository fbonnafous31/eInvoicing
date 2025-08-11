#!/bin/bash

# Lancer le backend
echo "Démarrage du backend..."
cd backend
node server.js &

# Lancer le frontend
echo "Démarrage du frontend..."
cd ../frontend
npm run dev


# chmod +x start.sh
# ./start.sh