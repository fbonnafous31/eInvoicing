export function getEnv() {
  // 1️⃣ Dev local → Vite .env
  if (import.meta.env.DEV || window.location.hostname === "localhost") {
    console.log("[Env] Mode DEV local → import.meta.env utilisé", import.meta.env);
    return import.meta.env;
  }

  // 2️⃣ Serveur dédié / Docker → config.js injecté côté serveur
  // On détecte Docker / serveur dédié avec une variable spécifique, ex: window.__ENV__ non vide et pas Render
  if (
    typeof window !== "undefined" &&
    window.__ENV__ &&
    Object.keys(window.__ENV__).length > 0 &&
    !window.__ENV__.IS_RENDER // ⚡ si tu veux signaler Render explicitement
  ) {
    console.log("[Env] Mode serveur dédié / Docker → window.__ENV__ utilisé");
    return window.__ENV__;
  }

  // 3️⃣ Render / Netlify / Vercel → variables Vite dans le bundle
  console.log("[Env] Mode PROD Render → import.meta.env utilisé");
  return import.meta.env;
}
