# Jour 140 – Rendre le stockage indépendant du support 📂🌐

Aujourd’hui, l’objectif n’était pas d’ajouter une fonctionnalité spectaculaire, mais de **préparer le projet à être portable et stable**, peu importe l’endroit où il tourne.

---

## 🧩 Pourquoi cette session

* Sur ma machine locale, tout fonctionne avec `fs` et les fichiers restent accessibles.
* Sur Render, le système de fichiers est **éphémère**, et chaque écriture directe peut disparaître ou poser problème.
* Demain, ce sera peut-être **Scaleway, AWS ou un autre fournisseur**. Si le code dépend du système local, il faudra tout réécrire à chaque migration.
* L’objectif est donc de créer **une abstraction de stockage universelle** : `save`, `get`, `delete`. Mon code devient **agnostique** : il ne se soucie plus du support derrière.

> Cette approche rend le projet **plus robuste et adaptable**, et protège le cœur du produit : le PDF/A-3.

---

## 🌱 Points humains / ressentis

* Ce matin, j’ai un peu précipité les choses et ça a causé des blocages 😅
* Revenir à cette réflexion sur le **pourquoi** me permet de **reprendre confiance** et de structurer le travail par étapes.
* Même si rien de spectaculaire n’est visible, c’est **la fondation nécessaire pour que le projet survive à n’importe quel hébergeur**.

---

## ✅ Bilan du jour

* Objectif : rendre le stockage PDF/A-3 indépendant du système local ✅
* Adapter local conservé comme point de départ stable ✅
* Base posée pour ajouter d’autres adapters et rendre le code portable ✅
