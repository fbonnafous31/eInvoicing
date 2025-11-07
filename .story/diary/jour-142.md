# Jour 142 – Rendre le stockage agnostique et centralisé 📂🌐

Aujourd’hui, l’objectif était de **supprimer toutes les dépendances directes au système de fichiers local** dans le produit, pour que l’application puisse fonctionner **peu importe l’environnement ou l’hébergeur**.

---

## 🧩 Pourquoi cette session

* Jusqu’ici, toutes les opérations d’écriture et de lecture PDF, Factur-X ou pièces jointes étaient **codées en dur avec `fs`**, ce qui limitait le projet à une machine locale.
* Sur Render ou tout autre hébergeur cloud, le système de fichiers est **éphémère**, et chaque écriture directe pouvait disparaître.
* L’objectif était donc de créer une **interface unique pour le stockage**, gérée par un `StorageService` et des adapters (aujourd’hui `LocalAdapter`), pour rendre le code **agnostique au support**.
* Cette abstraction prépare le terrain pour **changer d’adapter** (S3, Azure, autre) sans toucher au cœur du projet.

> L’idée est d’avoir **un backend robuste et portable**, où toutes les lectures, écritures, listes et suppressions passent par le même service.

---

## 🛠️ Travail technique effectué

1. **Création du `LocalAdapter`**

   * Méthodes implémentées : `save`, `get`, `delete`, `list`.
   * Gestion des **répertoires standards** (`factur-x`, `invoices`, `pdf-a3`) à la création de l’adapter.
   * Toutes les opérations locales remplacent les appels directs à `fs`.

2. **Centralisation avec `StorageService`**

   * `StorageService` encapsule l’adapter et expose la même interface (`save/get/delete/list`).
   * Permet de **changer facilement de backend de stockage** selon l’environnement (`process.env.STORAGE_ADAPTER`).
   * Toutes les parties du code qui manipulent des fichiers passent maintenant par `storageService`.

3. **Remplacement des instructions de lecture/écriture**

   * `fs.writeFile` / `fs.writeFileSync` → `storageService.save`
   * `fs.readFile` / `fs.readFileSync` → `storageService.get`
   * `fs.readdir` → `storageService.list`
   * `fs.unlink` / `fs.unlinkSync` → `storageService.delete`
   * **Procédures locales non critiques** (ICC profile, logo) laissées telles quelles.

4. **Adaptation du code existant**

   * `embedFacturXInPdf` : lecture du PDF, lecture du Factur-X et pièces jointes → via `storageService.get`.
   * Nettoyage des fichiers orphelins (`cleanupAttachments`) → lecture de la liste via `storageService.list`, suppression via `storageService.delete`.
   * Fonction `sendInvoiceMail` → récupération du PDF/A-3 via `storageService.get`.

5. **Tests et vérification**

   * Vérification dans les logs que chaque fichier est correctement créé dans les répertoires standards (`factur-x`, `invoices`, `pdf-a3`).
   * Contrôle que les PDF/A-3 sont bien conformes via le lab Iopole.
   * Tout le code continue de fonctionner sans `fs` direct, aucune régression constatée.

---

## 🌱 Points humains / ressentis

* Reprendre le **pourquoi** de chaque opération permet de ne pas se perdre dans le remplacement technique.
* Même si les changements ne sont pas visibles à l’UI, c’est **la fondation pour que le projet survive à n’importe quel hébergeur**.
* Voir les fichiers créés correctement et validés côté lab Iopole **renforce la confiance** dans cette nouvelle architecture.

---

## ✅ Bilan du jour

* Stockage abstrait : ✅ `StorageService` + `LocalAdapter` prêt pour n’importe quel backend.
* Tous les fichiers PDF/A-3, Factur-X et attachments passent maintenant par `storageService`.
* Nettoyage des fichiers orphelins opérationnel via `list` + `delete`.
* Lecture et envoi par email des PDF/A-3 fonctionnels.
* Logs et vérification PDF/A-3 sur le lab Iopole : ✅ conformité et génération correcte.

> Avec cette abstraction, **le projet est maintenant indépendant du système de fichiers local**, prêt à évoluer vers un stockage cloud, tout en gardant la cohérence et la robustesse des opérations PDF/A-3 et Factur-X.
