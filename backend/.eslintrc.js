module.exports = {
  parser: '@typescript-eslint/parser', // Permet à ESLint de comprendre TS
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // active les règles TS
  ],
  rules: {
    // ignore les paramètres préfixés par "_" pour no-unused-vars
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
