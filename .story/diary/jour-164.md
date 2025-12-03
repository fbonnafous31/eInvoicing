# Jour 164 — Centralisation des logs avec Loki pour eInvoicing 📑✨

Aujourd’hui, j’ai poursuivi le travail sur la supervision des logs du backend **eInvoicing**. Après avoir mis en place Pino pour centraliser mes logs en JSON, j’ai décidé de passer à l’étape suivante : **les envoyer dans un serveur centralisé pour pouvoir les exploiter facilement**.

---

## Pourquoi Loki ?

Loki est un **serveur de logs centralisé** développé par Grafana Labs :

* Il stocke tous les logs d’applications dans un format structuré et indexé.
* Il est optimisé pour être **rapide et léger**, même avec de gros volumes de logs.
* Il fonctionne bien avec Grafana, ce qui permet ensuite de **visualiser, filtrer et analyser** les logs facilement.

En résumé : **Loki va me permettre de ne plus avoir des fichiers éparpillés**, mais un endroit unique où tous les logs sont accessibles et interrogeables.

---

## Ce que j’ai mis en place

1. **Déploiement de Loki**

   * Container Docker `grafana/loki:2.9.0`.
   * Ports exposés : `3100`.
   * Volume `./loki-data` pour stocker le WAL et les données persistantes.
   * Connecté au réseau Docker `monitoring_net`.

2. **Déploiement de Promtail**

   * Container Docker `grafana/promtail:2.9.0`.
   * Surveille le dossier `../logs` contenant les fichiers JSON générés par Pino.
   * Envoie automatiquement les nouvelles entrées de log vers Loki.

---

## Vérification et tests

* J’ai ajouté un log test dans mon fichier journalier :

```bash
echo "Test log $(date)" >> ../logs/app-2025-12-03.log
```

* J’ai interrogé Loki via l’API pour récupérer les 5 dernières entrées :

```bash
curl -G http://localhost:3100/loki/api/v1/query \
     --data-urlencode 'query={job="eInvoicing"}' \
     --data-urlencode 'limit=5'
```

* Le log apparaît correctement, ce qui confirme que **Promtail détecte les fichiers et envoie les entrées à Loki**.

---

## Mon ressenti

* Les logs sont maintenant **centralisés dans Loki**, prêts à être exploités.
* Cela ouvre la voie à **la création de dashboards Grafana**, alertes, filtrages et recherches avancées.
* Je conserve les fichiers journaliers Pino, mais je peux maintenant analyser **tous les logs d’un coup**.

---

## Prochaine étape

* Configurer **Grafana** pour lire les logs depuis Loki.
* Créer un **tableau de bord simple** pour visualiser les logs en temps réel et filtrer par niveau ou module.
* Introduire progressivement des **alertes** sur certains événements critiques.

✅ Aujourd’hui, eInvoicing gagne une **infrastructure de logs centralisée**, qui prépare le terrain pour un suivi sérieux et une exploitation avancée des événements backend.
