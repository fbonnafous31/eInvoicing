# Jour 137 – Stabilisation de la preprod et corrections réseau/SSL 🛠🌫️

Aujourd’hui, l’objectif n’était plus de créer l’environnement preprod, mais de le faire fonctionner réellement : frontend, backend, Auth0 et base de données ensemble, dans les conditions « vraies » d’un déploiement Render.
Et comme souvent avec les environnements cloud… la théorie est simple, la pratique un peu plus subtile. 😉

---

## 🧩 Les ajustements techniques

### 1) Variables d’environnement et `config.js`
En local, le frontend chargeait une config embarquée dans `config.js`.
Mais sur Render, cela écrasait les `import.meta.env` pourtant correctement renseignées.

➡️ On a modifié la logique pour que :

- En local → on peut utiliser `config.js`
- En staging / preprod → `import.meta.env` est la source unique et fiable

Ce petit changement a ré-aligné front, backend et Auth0.

---

### 2) URL d’API unifiées dans tout le frontend
Il restait des URLs codées en dur (`http://localhost`) dans certains services.

➡️ Mise en place d’un unique `VITE_API_URL`, injecté partout.

Cela simplifie et sécurise les déploiements multi-environnements.

---

### 3) Connexion PostgreSQL sur Render : le fameux `SSL/TLS required`
En local, pas de SSL.
Sur Render, PostgreSQL exige SSL.

➡️ Ajout de :

```
ssl: { rejectUnauthorized: false }
```

dans la configuration du `Pool`.

C’est lui qui a débloqué le backend en preprod. 🎯

---

### 4) Reverse proxy / HTTPS : activation du `trust proxy`
Render termine la connexion TLS et passe ensuite la requête au Node server.
Sans `app.set('trust proxy', 1)`, Express pense que la requête n’est pas HTTPS.

➡️ Correction appliquée → communication stable ✅

---

## 🌱 Mes ressentis du jour

Ce déploiement m’a rappelé quelque chose de fondamental :

> Ce qui marche parfaitement en local peut se casser complètement en environnement réel.

Ce n’est pas difficile, mais ça demande de la patience, de la méthode et de la lucidité.

Je commence vraiment à apprécier l’idée d’environnements reproductibles :
si je sais monter un staging et une preprod sans bricoler, alors la production sera presque une formalité.

C’est une sensation de solidité. De fondation.

---

## ✅ Bilan du jour

- Fix `getEnv()` et `config.js` sur Render ✅
- URLs API unifiées via `VITE_API_URL` ✅
- Connexion PostgreSQL avec SSL ✅
- Proxy HTTPS Render correctement géré ✅
- Preprod fonctionnelle, avec création vendeur et client ✅

> Ça avance. Lentement parfois, mais dans le bon sens.
> Plus j’automatise, moins j’aurai à y penser demain.

Demain → Auth0 dédié preprod.
On se rapproche d’un espace prêt pour les bêta-testeurs. 🚀