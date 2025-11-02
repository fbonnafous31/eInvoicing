export function getEnv() {
  // 1️⃣ Dev local → .env Vite
  if (import.meta.env.DEV) {
    return import.meta.env;
  }

  // 2️⃣ Serveur dédié / Docker → config.js doit EXISTer ET contenir des valeurs
  if (
    typeof window !== "undefined" &&
    window.__ENV__ &&
    Object.keys(window.__ENV__).length > 0
  ) {
    console.log("[Env] Mode serveur dédié → window.__ENV__ utilisé", window.__ENV__);
    return window.__ENV__;
  }

  // 3️⃣ Render / Netlify / Vercel → variables Vite sont dans le bundle
  console.log("[Env] Mode PROD Render → import.meta.env utilisé", import.meta.env);
  return import.meta.env;
}
