#!/bin/bash
# ===================================================
# Guide de démarrage eInvoicing
# ===================================================

# 1️⃣ Lancer les containers
docker-compose up -d

# 2️⃣ Ouvrir un shell dans le container DB
docker-compose exec db bash

# 3️⃣ Restaurer le dump SQL dans PostgreSQL
psql -U einvoicing -d einvoicing_local -f /docker-entrypoint-initdb.d/einvoicing.sql

# ---------------------------------------------------
# Ensuite, le backend est sur : http://localhost:3000
# et le frontend sur : http://localhost:8080
# ---------------------------------------------------
