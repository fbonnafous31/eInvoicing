# 🛡️ Rapport d’audit des dépendances
_Généré le : lun. 01 déc. 2025 09:06:35 CET_

## Résumé global

| Critique | Haut | Moyen | Bas | Total |
|----------|------|-------|-----|-------|
| Backend | 0 | 0 | 2 | 0 | 2 |
| Frontend | 0 | 0 | 2 | 0 | 2 |

## Détails des vulnérabilités
| Package | Partie | Version actuelle | Sévérité | Correctif recommandé | URL |
|---------|--------|-----------------|----------|---------------------|-----|
| js-yaml | Backend + Frontend | moderate | - | - | []() |
| xmlbuilder2 | Backend + Frontend | moderate | - | - | []() |

## Fichier JSON complet

Le fichier JSON complet est disponible ici : `audit-result.json`.

## Remédiations automatiques

```
npm run audit:fix
```

Pour les vulnérabilités restantes ou critiques :

```
cd backend && npm audit fix --force
cd frontend && npm audit fix --force
```

> ⚠️ Attention : --force peut introduire des breaking changes.
