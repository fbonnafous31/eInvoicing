module.exports = {
  languageOptions: {
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
    },
    globals: {
      require: "readonly",
      module: "readonly",
      __dirname: "readonly",
      process: "readonly",
      console: "readonly",
      setTimeout: "readonly",
      Buffer: "readonly",
      describe: "readonly",
      it: "readonly",
      test: "readonly",
      expect: "readonly",
      jest: "readonly",
    },
  },
  rules: {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "no-console": "off",
  },
  linterOptions: {
    reportUnusedDisableDirectives: "warn",
  },
};
