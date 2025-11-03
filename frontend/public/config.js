// frontend/public/config.js
// ⚠️ Ce fichier n’est utilisé que pour que le navigateur ne plante pas sur Render
window.__ENV__ = {
  IS_RENDER: true // signal pour que getEnv() ignore ce fichier
};
