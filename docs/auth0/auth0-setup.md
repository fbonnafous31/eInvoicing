# Guide de création d'environnements Auth0 dédiés

## Objectif

Isoler un environnement (ex: **dev, staging, preprod, prod**) pour le frontend et backend, sans impacter les autres environnements, tout en utilisant le **même tenant Auth0**.

---

## 1️⃣ Créer les composants Auth0 pour cet environnement

### 1.1 Application frontend dédiée

1. Dans ton tenant Auth0, va dans **Applications → Applications**.
2. Clique sur **Create Application**.
3. Nom : `Default App <ENV>`

   * `<ENV>` = nom de l’environnement, ex: `Preprod`, `Staging`, `Dev`
4. Type : **Single Page Application (SPA)**
5. Configure :

   * **Allowed Callback URLs** → `https://<ENV>.monsite.com/callback`
   * **Allowed Logout URLs** → `https://<ENV>.monsite.com`
   * **Allowed Web Origins** → `https://<ENV>.monsite.com`
6. Copie le **Client ID** pour le frontend.

### 1.2 API backend dédiée

1. Dans **Applications → APIs**, clique sur **Create API**.
2. Nom : `eInvoicing API <ENV>`
3. Identifier (Audience) : `https://<ENV>.monsite.com`
4. Algorithme : **RS256**
5. Définis les **scopes** si nécessaire (ex : `read:invoices`, `write:invoices`)
6. Copie l’**identifier** pour le backend.

> ⚠️ Important : l’audience doit être **unique par environnement** pour isoler les tokens JWT.

---

## 2️⃣ Mettre à jour les variables d’environnement

### 2.1 Backend

```env
AUTH0_DOMAIN   = <tenant Auth0>                    # inchangé
AUTH0_AUDIENCE = https://<ENV>.monsite.com         # identifier API dédié à cet environnement
```

### 2.2 Frontend

```env
VITE_API_URL         = https://<ENV>.monsite.com
VITE_AUTH0_DOMAIN    = <tenant Auth0>                     # inchangé
VITE_AUTH0_CLIENT_ID = <Default App <ENV> Client ID>      # nouveau client
VITE_AUTH0_AUDIENCE  = https://<ENV>.monsite.com          # audience backend dédié
```

---

## 3️⃣ Points importants

1. **Utilisateur unique** : le même compte peut se connecter à tous les environnements tant qu’il existe dans le tenant. ✅
2. **Isolement par environnement** : assuré par l’**audience** et les variables d’environnement.
3. **URLs** : callback, logout et web origins doivent correspondre à l’environnement.
4. **Client ID** : nouveau pour chaque environnement.
5. **Audience** : unique pour chaque API afin d’éviter que les tokens d’un environnement passent sur un autre.

---

## 4️⃣ Déploiement

1. Déploie le backend avec ses variables `.env.<ENV>`.
2. Déploie le frontend avec ses variables correspondantes.
3. Teste le flux : login → JWT → appel API de l’environnement.
4. Les tokens d’autres environnements ne passeront pas si l’audience est correctement configurée.

---

## 5️⃣ Astuce réutilisable

Pour créer un nouvel environnement, il suffit de :

1. Créer une **application frontend** et une **API backend** dédiées.
2. Définir une **audience unique** pour le backend.
3. Mettre à jour les **variables d’environnement** du frontend et du backend.
4. Tester le flux.

Ainsi, la prochaine fois que tu ajoutes un environnement, tu suis cette note étape par étape et tout est isolé correctement.
