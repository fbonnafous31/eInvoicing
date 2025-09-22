// eslint.config.cjs
module.exports = {
  languageOptions: {
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    globals: {
      window: "readonly",
      document: "readonly",
    },
  },
  plugins: {
    react: require("eslint-plugin-react"),
    "react-hooks": require("eslint-plugin-react-hooks"), // <-- ajouté
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",           // vérifie les hooks React
    "react-hooks/exhaustive-deps": "warn",           // vérifie les dépendances useEffect
  },
  linterOptions: {
    reportUnusedDisableDirectives: "warn",
  },
};
