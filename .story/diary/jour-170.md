# Jour 169 - Sécuriser les uploads PDF et les requêtes SQL 🛡️

Aujourd’hui, j’ai passé la journée à travailler sur ce que j’appelle la **sécurité invisible mais critique** du projet : tout ce qui se passe avant même que l’utilisateur voie quoi que ce soit. 😄

Concrètement, j’ai renforcé deux zones :

1. La **protection contre les injections SQL** sur le backend.
2. La **gestion des uploads PDF**, pour que personne ne puisse envoyer n’importe quoi et casser le serveur ou accéder à des fichiers d’un autre seller.

Bref, tout ce qui pourrait être tenté directement via l’API sans passer par l’interface.

---

## Pourquoi ce travail ?

Même si l’interface bloque déjà beaucoup d’actions interdites, l’API restait un point d’entrée vulnérable si quelqu’un voulait attaquer directement. Mon objectif :

* **Améliorer la qualité et la fiabilité du backend** du point de vue sécurité.
* Bloquer toutes les tentatives classiques d’injection ou de manipulation de fichiers.
* Garder l’API **prévisible, stable et sûre** pour faciliter la maintenance future.

Ce n’est pas une forteresse imprenable, mais c’est un gros pas pour que l’API soit plus robuste et propre. 🚀

---

## Ce que j’ai mis en place

### 🔐 Injection SQL : tout est préparé

* Toutes les requêtes utilisent **les placeholders `$1, $2` de pg`**.
* Même un payload du type `' OR 1=1 --` ne passe pas.
* SCHEMA est contrôlé par l’administrateur, jamais par l’utilisateur.
* Tests réalisés avec curl → aucune fuite, aucune erreur, rien ne casse.

Résultat : ✅ injection SQL impossible, backend plus fiable.

---

### 📦 Upload PDF : triple défense

1. **Stockage temporaire et nommage sécurisé**

   * Upload dans `uploads/tmp/`
   * Noms assainis + suffixe aléatoire pour éviter collisions et path traversal
2. **Filtrage et analyse**

   * Vérification MIME type `application/pdf`
   * Limite de taille (5 Mo max)
   * Extraction du texte avec `pdf-parse` pour détecter JavaScript ou actions automatiques dangereuses
3. **Déplacement final sécurisé**

   * Après validation → `uploads/invoices/`
   * Chemin contrôlé par le serveur, path traversal impossible

Tout est vérifié **avant que le fichier ne touche le stockage final**.

---

### 🧪 Tests en mode “attaque PDF”

* Path Traversal (`../../../etc/passwd.pdf`) → bloqué
* Fichier non-PDF déguisé (`virus.png` renommé `.pdf`) → bloqué
* PDF avec JavaScript (`/JavaScript`) → bloqué
* Fichiers trop gros (>5 Mo) → bloqué
* Filenames malveillants (`../../../../etc/passwd.pdf`) → bloqué

Résultat : ✅ aucun fichier dangereux ne passe, serveur stable, réponses cohérentes.

---

## Résultat final

* Les injections SQL sont impossibles.
* Les PDFs sont analysés, filtrés et sécurisés avant stockage.
* Path traversal, fichiers déguisés, JavaScript embarqué, collisions, DoS par upload massif → tous bloqués.
* Backend stable et prévisible, même avec plusieurs requêtes simultanées.

Ce n’est pas une forteresse, mais **la qualité et la résilience du backend ont clairement progressé**.

---

## Une journée technique mais ultra satisfaisante 😄

eInvoicing devient un peu plus **robuste, résilient et fiable**. Même si quelqu’un attaque directement l’API, il ne pourra rien casser et ne verra rien qui ne lui appartient pas.

On avance vers un SaaS propre et multi-tenant comme il faut, avec la base solide avant tout le reste.
