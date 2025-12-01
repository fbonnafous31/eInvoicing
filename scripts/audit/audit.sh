#!/bin/bash

SCRIPT_DIR=$(dirname "$0")
OUTPUT_DIR="$SCRIPT_DIR"
OUTPUT_JSON="$OUTPUT_DIR/audit-result.json"
OUTPUT_MD="$OUTPUT_DIR/audit-report.md"

mkdir -p $OUTPUT_DIR

# --- Préparer lockfiles si absent ---
prepare_project() {
  PROJECT_DIR=$1
  echo "🔧 Vérification du lockfile pour $PROJECT_DIR..."
  if [ ! -f "$PROJECT_DIR/package-lock.json" ]; then
    echo "⚠️ package-lock.json absent. Création..."
    npm --prefix "$PROJECT_DIR" i --package-lock-only
  else
    echo "✅ package-lock.json présent."
  fi
}

prepare_project "backend"
prepare_project "frontend"

# --- Audit npm ---
echo "📦 Running npm audit for backend..."
npm --prefix backend audit --json > "$OUTPUT_DIR/audit-result.backend.json"
BACKEND_STATUS=$?

echo "📦 Running npm audit for frontend..."
npm --prefix frontend audit --json > "$OUTPUT_DIR/audit-result.frontend.json"
FRONTEND_STATUS=$?

# --- Fusion JSON ---
jq -s '{backend: .[0], frontend: .[1]}' "$OUTPUT_DIR/audit-result.backend.json" "$OUTPUT_DIR/audit-result.frontend.json" > "$OUTPUT_JSON"
rm "$OUTPUT_DIR/audit-result.backend.json" "$OUTPUT_DIR/audit-result.frontend.json"

# --- Génération Markdown ---
cat <<EOF > $OUTPUT_MD
# 🛡️ Rapport d’audit des dépendances
_Généré le : $(date)_

## Résumé global

| Critique | Haut | Moyen | Bas | Total |
|----------|------|-------|-----|-------|
| Backend | $(jq '.backend.metadata.vulnerabilities.critical' $OUTPUT_JSON) | $(jq '.backend.metadata.vulnerabilities.high' $OUTPUT_JSON) | $(jq '.backend.metadata.vulnerabilities.moderate' $OUTPUT_JSON) | $(jq '.backend.metadata.vulnerabilities.low' $OUTPUT_JSON) | $(jq '.backend.metadata.vulnerabilities.total' $OUTPUT_JSON) |
| Frontend | $(jq '.frontend.metadata.vulnerabilities.critical' $OUTPUT_JSON) | $(jq '.frontend.metadata.vulnerabilities.high' $OUTPUT_JSON) | $(jq '.frontend.metadata.vulnerabilities.moderate' $OUTPUT_JSON) | $(jq '.frontend.metadata.vulnerabilities.low' $OUTPUT_JSON) | $(jq '.frontend.metadata.vulnerabilities.total' $OUTPUT_JSON) |

## Détails des vulnérabilités
| Package | Partie | Version actuelle | Sévérité | Correctif recommandé | URL |
|---------|--------|-----------------|----------|---------------------|-----|
EOF

# --- Fusionner backend + frontend et générer tableau ---
jq -r '
  .backend.vulnerabilities as $b |
  .frontend.vulnerabilities as $f |
  ($b + $f) | to_entries[]
  | [
      .key,
      ( ( $b[.key]? != null and $f[.key]? != null ) 
        | if . then "Backend + Frontend"
          else (if $b[.key]? != null then "Backend" else "Frontend" end)
        end),
      .value.version,
      .value.severity,
      (.value.patched_versions // "-"),
      (.value.url // "-")
    ]
  | @tsv
' "$OUTPUT_JSON" | while IFS=$'\t' read -r pkg part ver sev patched url; do
  echo "| $pkg | $part | $ver | $sev | $patched | [$url]($url) |" >> "$OUTPUT_MD"
done

# --- Section remédiation ---
cat <<EOF >> $OUTPUT_MD

## Fichier JSON complet

Le fichier JSON complet est disponible ici : \`audit-result.json\`.

## Remédiations automatiques

\`\`\`
npm run audit:fix
\`\`\`

Pour les vulnérabilités restantes ou critiques :

\`\`\`
cd backend && npm audit fix --force
cd frontend && npm audit fix --force
\`\`\`

> ⚠️ Attention : --force peut introduire des breaking changes.
EOF

echo ""
echo "==================== AUDIT SUMMARY ===================="
echo "Markdown report: $OUTPUT_MD"
echo "JSON result: $OUTPUT_JSON"
echo "======================================================="

if [ $BACKEND_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
  exit 1
fi

echo "🎉 Audit completed successfully."
