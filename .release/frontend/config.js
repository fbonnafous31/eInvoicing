// frontend/config.js
// Fichier JS pur, servi par Nginx, utilisé par le frontend pour les variables runtime
// à configurer avec les URL API / APP / Auth0

window.__ENV__ = {
  // URL du backend (container ou hôte)
  VITE_API_URL: '',
  VITE_APP_URL: '',

  // Variables Auth0 du client
  VITE_AUTH0_DOMAIN: '',   
  VITE_AUTH0_CLIENT_ID: '',
  VITE_AUTH0_AUDIENCE: ''      
};
