#!/bin/bash

# Lancer les conteneurs de monitoring
docker-compose -f docker-compose.logs.yml up -d

# Ouvrir Grafana dans le navigateur par défaut
xdg-open http://localhost:3002
