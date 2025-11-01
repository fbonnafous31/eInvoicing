// frontend/src/utils/getEnv.js
export const getEnv = () => {
  // 1. Mode développement local Vite
  if (import.meta.env.DEV) return import.meta.env;

  // 2. Production Render ou autre build Vite
  if (import.meta.env.VITE_AUTH0_DOMAIN) return import.meta.env;

  // 3. Serveur Docker / config.js
  if (window.__ENV__) return window.__ENV__;

  // Aucune variable trouvée
  console.error("Auth0 variables are missing!");
  return {};
};
