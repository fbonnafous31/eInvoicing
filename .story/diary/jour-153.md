# Jour 153 – Construire le blog pour raconter l’histoire du projet 📝💻

Aujourd’hui, l’objectif était de **poser les bases de mon blog personnel**, pour pouvoir raconter **l’histoire de mon projet eInvoicing** et partager mes réflexions techniques de manière claire et attractive.

---

## 🎯 Objectif de la session

* Créer la **structure Next.js** du blog avec Tailwind et dark mode.
* Préparer l’**arborescence des séries** : Journal du dev et App de facturation.
* Mettre en place **le loader d’articles MDX** pour récupérer les titres, dates et résumés.
* Commencer à réfléchir à **l’expérience utilisateur** et à la cohérence visuelle.

> L’idée : avoir un **blog fonctionnel rapidement**, même minimal, pour commencer à écrire et tester la navigation série → article.

---

## 🛠️ Travail technique effectué

### 1. Structure Next.js

* Création des pages : `/journal`, `/app-facturation` et pages dynamiques `[slug]`.
* Mise en place des **composants réutilisables** : `ArticleCard` pour afficher les articles, `ProjectCard` pour le portfolio.
* Ajout d’un **layout global** avec header, footer, dark mode et responsive design.

### 2. Loader d’articles MDX

* Création du helper `getPosts(series: string)` :

  * Lit le dossier `/posts/<serie>`
  * Récupère `title`, `date`, `summary` et `slug` depuis les fichiers `.mdx`.
* Gestion des articles vides (`.gitkeep`) pour éviter les erreurs.
* Préparation pour le rendu complet MDX dans les pages `[slug]`.

### 3. Page d’accueil et navigation

* Page d’accueil stylisée avec :

  * Titre et description du blog
  * Boutons pour accéder à chaque série
* Navigation simple, responsive et accessible.
* Premiers articles “fictifs” ajoutés pour tester le rendu.

---

## 🧪 Résultats

✅ Arborescence du blog créée et fonctionnelle.
✅ Loader MDX prêt à récupérer les articles.
✅ Pages série et cartes d’articles en place.
✅ Navigation simple et cohérente sur toutes les pages.

> Même si le contenu MDX complet n’est pas encore affiché, la **base est solide** pour écrire et publier les articles.

---

## 💭 Ressenti / humain

* Très satisfaisant de voir **l’application prendre forme côté blog**, en parallèle de l’application de facturation.
* Le projet devient plus **vécu et racontable**, pas seulement technique.
* Sentiment de **progression visible**, même si les détails MDX et la finalisation du rendu seront à peaufiner.
* Ce blog va aussi servir à **documenter le projet**, ce qui est précieux pour garder une trace et partager.

---

## ✅ Bilan du jour

* Structure Next.js + Tailwind mise en place : ✅
* Pages séries et pages dynamiques `[slug]` créées : ✅
* Loader MDX fonctionnel pour récupérer métadonnées : ✅
* Page d’accueil et navigation cohérentes : ✅

> Avec ce premier jet, le blog est prêt à recevoir **les articles et les contenus détaillés**. La prochaine étape sera de **rendre le contenu MDX complet**, avec le rendu du Markdown et des composants React intégrés.
