# Jour 165 — Visualisation des logs avec Grafana pour eInvoicing 📊✨

Aujourd’hui, j’ai poursuivi le travail sur la supervision des logs de **eInvoicing** en **connectant Grafana à Loki**. L’objectif était de passer de la simple centralisation à une **visualisation exploitable et agréable**.

---

## Mise en place de Grafana

1. **Déploiement du container Grafana**

   * Image Docker `grafana/grafana:latest`.
   * Ports exposés : `3002` pour éviter de rentrer en conflit avec d’autres instances.
   * Initialisation avec un mot de passe admin (`admin` pour l’instant).

2. **Connexion à Loki**

   * Ajout de Loki comme **Data Source** dans Grafana.
   * Vérification de la connexion : les logs remontent correctement.
   * Test avec une requête simple `{job="eInvoicing"}` pour visualiser les entrées JSON.

---

## Exploration et visualisation

* Dans Grafana, j’ai testé la vue **Explore** pour interroger les logs en temps réel.
* J’ai ajouté un **tableau** pour afficher les informations clés du logger Pino :

  * `level` — niveau de log
  * `time` — horodatage
  * `msg` — message principal
  * `req.method` et `req.url` — info de requête
  * `res.statusCode` — code de réponse
* J’ai transformé le timestamp brut en **heure lisible en français**, ce qui rend le tableau beaucoup plus clair.

---

## Persistance et sauvegarde

* Pour éviter de tout perdre, j’ai configuré un **volume Docker pour Grafana** afin de conserver les dashboards et la configuration.
* J’ai testé la **sauvegarde du dashboard** via l’option d’export JSON, ce qui permettra de le réimporter facilement en cas de reset ou de déplacement.

---

## Tests pratiques

* Ajout d’un log test avec Pino :

```bash
echo '{"level":30,"time":'$(date +%s%3N)',"app":"einvoicing","msg":"test log"}' >> ../logs/app-2025-12-04.log
```

* Observation immédiate de l’entrée dans Grafana.
* Confirmation que **Promtail détecte et envoie les logs** à Loki, puis que Grafana les visualise correctement.

---

## Mon ressenti

* L’interface est maintenant **propre et exploitable** : je peux filtrer, trier, et lire les logs facilement.
* La combinaison **Loki + Grafana + Promtail** fonctionne de manière fluide.
* Je peux désormais quitter mon environnement et revenir plus tard sans perdre le travail : tout est persistant et exportable.

---

## Prochaine étape

* Créer des **dashboards plus détaillés** avec graphiques et statistiques.
* Ajouter des **filtres interactifs** et des **alertes** pour les événements critiques.
* Éventuellement, intégrer d’autres services backend pour centraliser tous les logs dans Grafana.

✅ Aujourd’hui, eInvoicing passe à l’étape **visualisation et supervision avancée**, avec des logs clairs et un dashboard réutilisable.
