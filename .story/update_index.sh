#!/bin/bash
# update_index.sh
cd diary/ || exit

# Créer/écraser index.md
echo "# Index du journal" > index.md
echo "" >> index.md

# Boucle sur tous les fichiers triés
for f in $(ls jour-*.md | sort); do
  # Récupérer la première ligne et nettoyer le # si présent
  title=$(head -n 1 "$f" | sed 's/^# //')
  # Ajouter une entrée avec lien
  echo "- [$title]($f)" >> index.md
done
