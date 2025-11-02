# ESLint Cheat Sheet – eInvoicing

Cette fiche résume l'utilisation d'ESLint dans le projet **eInvoicing** pour React + Vite.

---

## 1️⃣ Installation

```bash
cd frontend
npm install --save-dev eslint eslint-plugin-react eslint-plugin-unused-imports
```

* `eslint-plugin-react` : règles spécifiques pour React
* `eslint-plugin-unused-imports` : supprime ou signale les imports inutilisés

---

## 2️⃣ Configuration de base (`.eslintrc.json`)

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["react", "unused-imports"],
  "rules": {
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

> Permet de détecter et supprimer les imports inutilisés et appliquer les bonnes pratiques React.

---

## 3️⃣ Commandes fréquentes

### Lancer le linter sur tous les fichiers

```bash
npx eslint "src/**/*.{js,jsx}" --ext .js,.jsx
```

### Corriger automatiquement les problèmes réparables

```bash
npx eslint "src/**/*.{js,jsx}" --ext .js,.jsx --fix
```

### Vérifier les imports inutilisés

* ESLint avec `unused-imports/no-unused-imports` signale automatiquement les imports jamais utilisés.
* Pour les composants non importés nulle part, utiliser le script Node.js `find-unused-components.js`.

---

## 4️⃣ Intégration dans VSCode

* Installer l’extension **ESLint**
* Activer **Format on Save** et **Lint on Save**
* Les erreurs et warnings apparaissent directement dans l’éditeur

---

## 5️⃣ Bonnes pratiques React

* Inclure toutes les dépendances dans `useEffect` et `useCallback`.
* Supprimer régulièrement les imports inutilisés.
* Utiliser les hooks correctement pour éviter les warnings `react-hooks/exhaustive-deps`.

---

## 6️⃣ Script complémentaire : composants non utilisés

Pour détecter les composants React jamais importés nulle part :

```bash
node find-unused-components.js
```

* Scanne `src/components`
* Vérifie tous les imports dans `src/`
* Affiche les composants probablement inutilisés

---

## 7️⃣ Schéma simplifié

```text
+-------------+     analyse     +-----------+
|  Frontend   | --------------> |  ESLint   |
|   src/      |                 |           |
+-------------+                 +-----------+
       |                             |
       | warnings / errors           |
       v                             v
Code propre, imports supprimés   Indications sur style et bugs
```

> ESLint guide le développeur pour écrire du code propre, éviter les bugs et garder la base de code maintenable.
