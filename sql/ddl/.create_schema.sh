#!/bin/bash
# DBeaver, se positionner sur la db einvoicing et exporter le schéma en SQL
# puis remplacer dans le fichier exporté les occurrences de "invoicing." par "staging."

sed -i 's/invoicing\./staging./g' db_schema.sql

