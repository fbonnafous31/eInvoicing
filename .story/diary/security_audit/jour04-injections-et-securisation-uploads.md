# 🛡️ Audit technique de sécurité — eInvoicing

**Date :** 11 décembre 2025
**Version :** 1.0 — Parties 1, 2 & 3 (SQL + Upload PDF sécurisé)

---

## 1. Contexte

L'objectif de cet audit est de documenter la sécurisation des points critiques de l'application eInvoicing, incluant :

* La protection contre les **attaques par injection SQL** sur le backend Node.js avec `pg`.
* La sécurisation des **uploads PDF** via le middleware `upload.js`.
* Les mesures intermédiaires de sécurité appliquées lors de la phase de traitement des fichiers (Partie 2).

---

## 2. Partie 1 — Attaques par injection SQL

### 2.1 Paramétrage SQL

* Utilisation systématique de **requêtes préparées** avec `pg`.
* Exemple :

```js
const result = await pool.query(
  `SELECT id, is_company, legal_name, firstname, lastname
   FROM ${SCHEMA}.clients
   WHERE seller_id = $1
   ORDER BY legal_name`,
  [sellerId]
);
```

**Observation :** ✅ Aucun risque d’injection via paramètres utilisateur, SCHEMA est contrôlé par l’administrateur.

### 2.2 Tests réalisés

* Tentatives avec payloads : `' OR 1=1 --`, `" OR 1=1 --`
* Résultat : Aucun comportement anormal, aucune fuite SQL.

### 2.3 Bilan SQL

* Requêtes préparées bien appliquées.
* Aucun champ utilisateur injecté dans la chaîne SQL.
* Risque d’injection SQL : **NON VULNÉRABLE** ✔️

---

## 3. Partie 2 — Sécurisation intermédiaire de l’upload PDF

### 3.1 Middleware Multer et stockage temporaire

* Fichiers uploadés dans `uploads/tmp/`.
* Noms assainis avec `sanitize-filename` et suffixe aléatoire.
* Prévention de collisions et de path traversal.

### 3.2 Filtrage MIME et taille

* Vérification du **MIME type** (`application/pdf`) avant acceptation.
* Limitation taille : 5 Mo maximum.
* Rejet automatique si non-conforme.

### 3.3 Analyse a priori du contenu PDF

* Extraction texte via `pdf-parse`.
* Détection de motifs à risque : `/JavaScript/`, `/JS/`, `/AA/`, `/OpenAction/`.
* PDF contenant du code actif ou actions automatiques → rejet.

### 3.4 Déplacement sécurisé vers le dossier final

* Fichiers validés déplacés de `tmp/` → `invoices/` via `fs.renameSync`.
* Aucun chemin dynamique fourni par l’utilisateur.
* Empêche path traversal.

### 3.5 Tests d’attaque réalisés

| Type d’attaque              | Exemple testé                       | Résultat |
| --------------------------- | ----------------------------------- | -------- |
| Path Traversal              | `../../../etc/passwd.pdf`           | Bloqué   |
| Fichier non-PDF déguisé     | `virus.png` renommé `.pdf`          | Bloqué   |
| PDF avec payload JavaScript | `/JavaScript (app.alert('Hacked'))` | Bloqué   |
| Fichiers volumineux         | >5 Mo                               | Bloqué   |
| Filenames malveillants      | `../../../../etc/passwd.pdf`, `%00` | Bloqué   |

**Observation :** ✅ Défense multi-couche en entrée, traitement et stockage final.

---

## 4. Partie 3 — Upload PDF sécurisé avancé

### 4.1 Vérification d’intégrité optionnelle

* QPDF (`--check`) pour vérifier la structure interne.
* Rejet immédiat si PDF corrompu ou suspect.

### 4.2 Gestion multi-fichiers

* `secureUpload(fields)` gère plusieurs fichiers : nettoyage automatique si erreur, rejet fichiers invalides.

### 4.3 Bilan global

* Stockage temporaire isolé
* Noms de fichiers assainis + suffixe aléatoire
* Filtrage MIME strict
* Analyse du contenu PDF
* Limitation taille / anti-PDF bomb
* Déplacement final sécurisé
* Gestion multi-fichiers avec nettoyage automatique

✅ Middleware robuste contre Path Traversal, fichiers déguisés, JavaScript embarqué, overwrites et DoS.

---

## 5. Conclusion générale

L’application eInvoicing présente un **niveau de sécurité solide** pour :

* Injections SQL
* Gestion des fichiers PDF (Partie 2 & 3)

**Points à surveiller :**

* Maintenance des dépendances (`multer`, `pdf-parse`, `file-type`).
* Vérification structurelle avec QPDF.
* Rotation et révocation des JWT.

✅ Recommandation : Continuer à appliquer les bonnes pratiques et tests automatisés sur ces vecteurs critiques.
