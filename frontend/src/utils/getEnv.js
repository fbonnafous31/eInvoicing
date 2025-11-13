export function getEnv() {
  console.log("🏷️ window.__ENV__ existe ?", typeof window !== "undefined" && window.__ENV__);
  console.log("🏷️ import.meta.env.DEV ?", import.meta.env.DEV);
  console.log("🏷️ window.location.hostname", typeof window !== "undefined" ? window.location.hostname : "N/A");

  // 1️⃣ Serveur dédié / Docker → config.js injecté côté serveur
  if (typeof window !== "undefined" && window.__ENV__ && window.__ENV__.VITE_API_URL) {
    console.log("[Env] Mode serveur dédié / Docker → window.__ENV__ utilisé :", window.__ENV__);
    return window.__ENV__;
  }

  // 2️⃣ Dev local → Vite .env
  if (import.meta.env.DEV || (typeof window !== "undefined" && window.location.hostname === "localhost")) {
    console.log("[Env] Mode DEV local → import.meta.env utilisé :", import.meta.env);
    return import.meta.env;
  }

  // 3️⃣ Production cloud → fallback
  console.warn("[Env] Mode PROD cloud → fallback sur import.meta.env :", import.meta.env);
  return import.meta.env || {};
}
