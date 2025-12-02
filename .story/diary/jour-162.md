# Jour 162 — Logs : mise en place de Pino pour centraliser et exploiter mes journaux 📑✨

Aujourd’hui, j’ai décidé de m’attaquer à un point que je repoussais depuis un moment : **la centralisation et la rotation de mes logs** dans eInvoicing.
Jusqu’à présent, je me contentais de `console.log` pour suivre ce qui se passait dans le backend. Pratique pour le développement, mais **impossible à exploiter correctement en production** : je n’avais aucun historique, pas de journal exploitable, et surtout pas de structure JSON pour analyser ou monitorer mon application.

---

## Pourquoi migrer vers Pino ?

Pino est un **logger rapide, léger et structuré** pour Node.js. Les avantages principaux sont :

1. **Logs structurés** : au lieu de simples chaînes de caractères, chaque log peut être en JSON avec timestamp, niveau, message et métadonnées.
2. **Multi-destination** : je peux afficher les logs en console et les écrire dans des fichiers séparés.
3. **Performance** : contrairement à `console.log`, Pino ne bloque pas l’application.
4. **Exploitation des logs** : en JSON, je peux analyser les logs automatiquement, remonter des alertes ou générer des dashboards.

En résumé : c’est le **passage d’un simple suivi ponctuel à une véritable infrastructure de logs**.

---

## Ce que j’ai mis en place

### 🔹 Logger centralisé

J’ai créé `src/utils/logger.js` :

* Les logs sont écrits **en console** (lisible grâce à `pino-pretty`).
* Ils sont également écrits **dans un fichier journalier** (`logs/app-YYYY-MM-DD.log`) pour conserver l’historique.
* Chaque entrée de log contient :

  * `timestamp` — la date et l’heure exactes
  * `level` — INFO, ERROR, etc.
  * `message` — texte descriptif
  * éventuellement des **métadonnées** comme l’ID de facture ou le nom de l’utilisateur.

Exemple d’utilisation :

```js
logger.info("Backend démarré sur http://localhost:3000");
```

Résultat en console :

```
[BACKEND] [11:15:07.323] INFO (39141): Backend démarré sur http://localhost:3000
```

Et dans le fichier JSON `logs/app-2025-12-02.log` :

```json
{"level":30,"time":1700008507323,"pid":39141,"hostname":"mon-serveur","msg":"Backend démarré sur http://localhost:3000"}
```

---

### 🔹 Middleware de logs pour les requêtes

Pour remplacer mes `console.log("Requête reçue…")` dans Express, j’ai créé `loggerMiddleware.js` :

* Chaque requête HTTP reçoit un accès à `req.log` pour logger directement dans le contexte de la requête.
* Exemple :

```js
app.get("/api/clients", (req, res) => {
  req.log.info({ path: req.originalUrl, method: req.method }, "Route appelée");
  res.send(...);
});
```

Ainsi, tous les logs des requêtes sont centralisés, structurés, et écrits **à la fois en console et dans les fichiers journaliers**.

---

### 🔹 Structure des fichiers de logs

* Le dossier `backend/logs` est créé automatiquement si inexistant.
* Chaque jour, un **nouveau fichier** est généré : `app-YYYY-MM-DD.log`.
* Rotation simple : je garde **14 jours** de logs pour ne pas saturer le disque.
* Les anciens fichiers restent lisibles et exploitables pour analyse, debug ou audit.

---

## Mon ressenti

* Je peux maintenant **abandonner les `console.log` dispersés** sans perdre d’information.
* Les logs sont **exploitable en JSON**, ce qui ouvre la voie à des dashboards, alertes ou traitements automatiques.
* Je vois immédiatement dans la console le log au démarrage, mais il est aussi conservé dans un fichier horodaté pour audit ou debug ultérieur.
* Même si je ne migre pas tout le code en Pino dès maintenant, je peux **introduire Pino progressivement**, route par route ou module par module.

---

## Prochaine étape

* Remplacer progressivement les `console.log` restants par `logger.info()` ou `req.log.info()` pour **avoir une trace complète du backend**.
* Ajouter éventuellement des **logs de niveau WARN et ERROR** pour capturer les anomalies ou exceptions.
* Exploiter ces fichiers JSON pour créer un **tableau de bord ou un suivi automatisé** des événements clés du backend.

---

Aujourd’hui, eInvoicing gagne donc une **infrastructure de logs professionnelle**, qui remplace le bricolage des consoles et prépare le terrain pour un suivi sérieux et une exploitation des données en production.

✅ Une étape simple mais fondamentale pour transformer mon code solo en application **robuste et observée**.
