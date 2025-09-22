# Jour 79 – Mise en place de la CI pour eInvoicing 🚀

Aujourd’hui, j’ai travaillé sur la **CI (Continuous Integration)** de notre projet **eInvoicing**, pour automatiser les tests et la vérification du code à chaque push ou pull request sur `main`.

## Mise en place de GitHub Actions 🛠️

Le workflow CI a été configuré pour couvrir **backend et frontend** :

* **Installation de Node.js** sur un runner Ubuntu, avec gestion de versions via `matrix.node-version`.
* **Cache des `node_modules`** pour le backend et le frontend, afin d’accélérer les builds et éviter les réinstallations inutiles.
* **Installation des dépendances** pour le backend et le frontend séparément.
* **Exécution des tests unitaires et d’intégration** pour le backend et le frontend, avec génération de rapports de couverture (`--coverage`).
* **Upload des artefacts de couverture** pour consultation et usage futur.

## Résultat de cette mise en place ✅

* La CI est désormais capable de **tester automatiquement** le backend et le frontend à chaque push ou pull request sur `main`.
* Les artefacts de couverture sont stockés et prêts à être utilisés pour un suivi de la qualité du code.
* Le workflow est structuré pour être facilement **étendu** à linting, Codecov, et d’autres vérifications automatiques à l’avenir.

## 📌 Prochaines étapes

* **Ajouter le linting** pour imposer les bonnes pratiques sur backend et frontend.
* **Intégrer Codecov** avec un token pour suivre la couverture de code et visualiser les rapports.
* Enrichir les tests frontend pour couvrir davantage de composants critiques et d’intégrations.
* Documenter le workflow CI pour que son maintien et son évolution soient simples et clairs.
