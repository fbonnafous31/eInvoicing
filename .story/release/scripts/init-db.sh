#!/bin/bash
set -e

# Variables
DB_NAME="einvoicing_local"
DB_USER="einvoicing"
DB_PASS="einvoicing"
DUMP_FILE="/docker-entrypoint-initdb.d/einvoicing.sql"

export PGPASSWORD=$DB_PASS

echo "🔄 Restauration forcée de la base $DB_NAME depuis $DUMP_FILE..."

# Supprime les tables existantes dans le schema invoicing
psql -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1 <<EOSQL
DROP SCHEMA IF EXISTS invoicing CASCADE;
CREATE SCHEMA invoicing AUTHORIZATION $DB_USER;
EOSQL

# Restaurer le dump
psql -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1 -f $DUMP_FILE

echo "✅ Base restaurée avec succès."
