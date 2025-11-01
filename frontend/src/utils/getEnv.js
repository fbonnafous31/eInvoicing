// frontend/src/utils/getEnv.js
export function getEnv() {
  // 1️⃣ Dev local → .env Vite
  if (import.meta.env.DEV) {
    console.log("[Env] Mode DEV → import.meta.env utilisé", import.meta.env);
    return import.meta.env;
  }

  // 2️⃣ Serveur tiers / Docker avec config.js → window.__ENV__
  if (typeof window !== "undefined" && window.__ENV__) {
    console.log("[Env] Mode PROD / serveur dédié → window.__ENV__ utilisé", window.__ENV__);
    return window.__ENV__;
  }

  // 3️⃣ Production Render / autres environnements cloud
  console.warn("[Env] Variables runtime non trouvées, fallback sur import.meta.env", import.meta.env);
  return import.meta.env || {};
}
