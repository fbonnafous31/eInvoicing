# Jour 145 – Mise en place de Backblaze B2 pour le stockage 📂☁️

Ce week-end, j’ai avancé sur un gros chantier : rendre mon stockage **agnostique** et **cloud-ready**, en testant Backblaze B2.

---

## 🎯 Objectif

* Pouvoir **stocker tous les fichiers** (PDF, Factur-X, justificatifs) dans un backend cloud.
* Maintenir la compatibilité avec le stockage **local** pour le développement.
* Faire en sorte que le code reste **portable et agnostique**.

---

## ✅ Étapes déjà réalisées

| État | Tâche                                       |
| ---- | ------------------------------------------- |
| ✅    | Création du compte B2                       |
| ✅    | Création du bucket privé                    |
| ✅    | Génération des clés API                     |
| ✅    | Configuration `.env`                        |
| ⏳    | Intégration dans le backend Express         |
| ⏳    | Remplacer le `LocalAdapter` par `B2Adapter` |

> Pour le moment, j’ai **validé l’écriture sur Backblaze** avec mes premiers tests.

---

## 🛠️ Travail technique

1. **Création du `B2Adapter`**

   * Utilisation du SDK S3 (`@aws-sdk/client-s3`) pour Backblaze.
   * Méthodes implémentées : `save`, `get`, `delete`, `list`.
   * Conversion des streams S3 en `Buffer` pour la compatibilité avec le reste du code.
   * Exemple :

   ```js
   async get(fileName) {
     const res = await this.s3.send(new GetObjectCommand({
       Bucket: this.bucketName,
       Key: fileName,
     }));
     const data = await buffer(res.Body);
     return data;
   }
   ```

2. **Centralisation via `StorageService`**

   * `StorageService` reste le point unique d’accès au stockage.
   * Permet de **switcher entre Local et B2** selon `process.env.STORAGE_BACKEND`.
   * Extrait la logique d’adaptation du reste de l’application.

3. **Configuration dynamique**

   * `.env` définit :

     * `STORAGE_BACKEND` → `"local"` ou `"b2"`
     * `B2_ENDPOINT`, `B2_BUCKET_NAME`, `B2_KEY_ID`, `B2_APPLICATION_KEY`
   * Le code est **agnostique au backend**, ce qui facilite les tests et le déploiement.

---

## ⚠️ Points encore à traiter

* Adapter la logique pour **stocker et récupérer les justificatifs de factures** via B2.
* Assurer que tous les chemins et noms de fichiers soient **cohérents avec les précédents adapters**.
* Tester les **opérations combinées** : Factur-X + PDF principal + attachments + B2.
* Gérer les erreurs de réseau ou d’accès B2 pour ne pas bloquer la génération de factures.

---

## 🌱 Ressenti

* C’est excitant de **voir les premiers fichiers s’écrire sur B2**.
* Le code reste clair et réutilisable, ce qui renforce la confiance dans l’architecture **agnostique**.
* L’adaptation des justificatifs semble le prochain vrai challenge, mais je sens que l’approche **adapter + StorageService** me donnera la flexibilité nécessaire.

---

## ✅ Bilan du jour

* Adapter B2 fonctionnel pour **write/read/list/delete**.
* `StorageService` centralise désormais le stockage, local ou cloud.
* Début de tests d’intégration sur les fichiers critiques (PDF principal, Factur-X) réussis.
* Prochaine étape : **justificatifs et attachments**, intégration complète sur le backend.

> Avec cette approche, le projet peut évoluer facilement vers n’importe quel backend cloud, tout en gardant la compatibilité locale pour le développement.
