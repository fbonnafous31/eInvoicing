#!/bin/bash
# DBeaver, se positionner sur une DB de référence (invoicing) et exporter le schéma en SQL
# puis remplacer dans le fichier exporté les occurrences de "invoicing." par "staging."

# Remplacer le nom du schéma dans le fichier SQL exporté
sed -i 's/invoicing\./staging./g' db_schema.sql

