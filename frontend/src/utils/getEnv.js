export function getEnv() {
  // 1️⃣ Dev local → Vite .env
  const isDevLocal = import.meta.env.DEV || window.location.hostname === "localhost";
  if (isDevLocal) {
    console.log("[Env] Mode DEV local → import.meta.env utilisé", import.meta.env);
    return import.meta.env;
  }

  // 2️⃣ Docker local / serveur interne → USE_LOCALHOST priorisé
  const isDockerLocal = typeof window !== "undefined" && window.__ENV__?.USE_LOCALHOST === true;
  if (isDockerLocal) {
    console.log("[Env] Mode Docker local → localhost priorisé");
    return {
      VITE_API_URL: "http://localhost:3000",
      VITE_APP_ENV: "docker-local",
    };
  }

  // 3️⃣ Docker / serveur dédié → config.js injecté
  const hasServerEnv = typeof window !== "undefined" && window.__ENV__ && Object.keys(window.__ENV__).length > 0;
  if (hasServerEnv && !window.__ENV__.IS_RENDER) {
    console.log("[Env] Mode serveur dédié / Docker → window.__ENV__ utilisé");
    return window.__ENV__;
  }

  // 4️⃣ Prod hébergée (Render, Vercel, etc.) → fallback import.meta.env
  console.log("[Env] Mode PROD hébergé → import.meta.env utilisé");
  return import.meta.env;
}
