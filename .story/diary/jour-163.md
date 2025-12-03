# Jour 163 — Logs : enrichir le contexte et fiabiliser les routes 🚀📊

Après avoir mis en place Pino hier, j’ai passé la journée à **enrichir mes logs et sécuriser leur usage** dans toutes mes routes. Mon objectif : que chaque action métier soit tracée de manière claire et exploitable, sans risque de crash si un logger est absent.

---

## Pourquoi enrichir le contexte des logs ?

Hier, les logs contenaient déjà le `timestamp`, le `level` et le `msg`. Mais pour **vraiment comprendre ce qui se passe**, il me fallait :

* L’**ID du vendeur** (`sellerId`) pour savoir qui effectue l’action.
* L’**ID du client ou de la facture** quand une entité spécifique est manipulée.
* Les **données pertinentes** (`clientData`, `invoiceData`) pour avoir un aperçu sans ouvrir la base de données.

Avec ces informations, un simple fichier JSON suffit pour **retracer le parcours complet d’une action**, détecter des erreurs ou analyser le comportement des utilisateurs.

---

## Ce que j’ai fait concrètement

### 🔹 Mise à jour du middleware `requestLogger`

J’ai intégré un **child logger** à chaque requête avec un `requestId` unique :

```js
req.logger = logger.child({ requestId });
```

Ensuite, chaque log de fin de requête inclut :

```json
{
  "requestId": "UUID",
  "method": "GET",
  "url": "/api/clients/65",
  "statusCode": 200,
  "duration": "4.5ms",
  "user": { "id": 23 }
}
```

Résultat : toutes les requêtes sont **traçables**, même si elles sont simultanées.

---

### 🔹 Refactor des routes

Chaque route Express utilise maintenant **`req.log`** plutôt que `console.log` :

```js
router.get('/:id', (req, res, next) => {
  req.log.info({ clientId: req.params.id, sellerId: req.seller.id }, "Récupération d'un client");
  ClientsController.getClientById(req, res, next);
});
```

De cette manière :

* Les logs métier (création, mise à jour, suppression) contiennent toujours **les IDs et données clés**.
* Les logs HTTP (`HTTP request completed`) sont séparés et incluent le **requestId** pour relier les deux.

---

### 🔹 Sécurité et robustesse

Avant, certaines routes plantaient si `req.log` n’était pas défini. Maintenant :

* `req.log` est créé **dans le middleware de logging** dès le début de chaque requête.
* Les controllers peuvent logger en toute sécurité, même dans les erreurs.
* Les erreurs sont systématiquement capturées avec `req.log.error(err, "message")`, ce qui permet un **audit facile**.

Exemple :

```js
try {
  const clients = await ClientsService.getClients(req.seller.id);
  res.json(clients);
} catch (err) {
  req.log.error({ err }, "Erreur lors de la récupération des clients");
  res.status(500).json({ error: "Impossible de récupérer les clients" });
}
```

---

### 🔹 Résultat en pratique

Mes logs ressemblent maintenant à ça :

```json
{"level":30,"time":1764749741853,"env":"development","app":"einvoicing","sellerId":23,"clientId":"65","msg":"Récupération d'un client"}
{"level":30,"time":1764749741854,"env":"development","app":"einvoicing","requestId":"2a4f65f2-9acd-4a68-90dc-77b943e1d3b6","method":"GET","url":"/api/clients/65","statusCode":304,"duration":"3.79ms","user":{},"msg":"HTTP request completed"}
```

Chaque action métier est maintenant **liée à son contexte**, et toutes les requêtes HTTP ont leur **requestId** pour le suivi.

---

## Mon ressenti

* Les logs sont **complets et exploitables**.
* Chaque action peut être retracée sans ouvrir la base.
* Je peux maintenant faire du debug **rapidement et proprement**, et préparer l’analyse des métriques ou incidents.
* Même les erreurs inattendues sont **capturées et contextualisées**.

---

## Prochaine étape

* Ajouter des logs **WARN et ERROR** sur les routes sensibles.
* Enrichir certains logs avec plus de métadonnées (`invoiceId`, `attachmentId`) pour les workflows complexes.
* Commencer à **consommer ces logs JSON** dans un dashboard ou un outil d’observabilité pour visualiser les actions des utilisateurs et la santé du backend.

---

Aujourd’hui, eInvoicing est passé à **un niveau supérieur de traçabilité et de robustesse** : chaque action est visible, chaque erreur est traçable, et le backend devient **plus sûr et professionnel**.

✅ Avec ce setup, même si je suis seul sur le projet, je peux **garder un œil précis sur tout ce qui se passe** et agir rapidement en cas de problème.
