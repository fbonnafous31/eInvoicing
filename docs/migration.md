# 🛠️ Système de migrations SQL

## 1️⃣ Objectif

Permet de gérer **les modifications de la base de données** de manière sécurisée et incrémentale, avec :

* Création automatique de la table `migrations`.
* Exécution uniquement des fichiers non encore appliqués.
* Suivi de la date d’exécution.

---

## 2️⃣ Structure des fichiers

```text
sql/
├── infrastructure/
│   └── create_migrations_table.sql   # Table qui stocke les migrations déjà appliquées
├── migrations/
│   ├── 001_init_schema.sql           # Exemple : création des tables principales
│   ├── 002_add_invoice_type.sql      # Exemple : ajout d’une colonne ou d’une table
│   └── 003_add_linked_invoice.sql    # Exemple : autre modification incrémentale
```

* Les fichiers **doivent être nommés avec un préfixe numérique** pour garder l’ordre d’exécution (`001_`, `002_`, …).
* Chaque fichier contient uniquement des commandes SQL **idempotentes** si possible (`IF NOT EXISTS`).

---

## 3️⃣ Exécution des migrations

Dans le backend, on utilise un script Node.js :

```bash
npm run migrate
```

Ce script fait :

1. Connexion à la base de données.
2. Création de la table `migrations` si elle n’existe pas.
3. Lecture de tous les fichiers de `sql/migrations`.
4. Exécution des fichiers **non encore appliqués**.
5. Enregistrement de chaque migration exécutée dans la table `migrations`.

✅ Résultat attendu :

```
✅ Connected to database
🚀 Running 001_init_schema.sql
✅ Migration 001_init_schema.sql applied
🚀 Running 002_add_invoice_type.sql
✅ Migration 002_add_invoice_type.sql applied
...
```

---

## 4️⃣ Ajouter une nouvelle migration

1. Crée un nouveau fichier SQL dans `sql/migrations/` avec le prochain numéro disponible :

```
004_add_new_column.sql
```

2. Ajoute les modifications SQL que tu veux :

```sql
ALTER TABLE invoicing.invoices
ADD COLUMN invoice_type varchar(50) DEFAULT 'standard';
```

3. Lance la migration :

```bash
npm run migrate
```

Le script détectera que c’est **une migration nouvelle** et l’appliquera.

---

## 5️⃣ Bonnes pratiques

* Toujours **numéroter les migrations** pour garantir l’ordre.
* Vérifier que le SQL est **idempotent** si possible (`IF NOT EXISTS`).
* Ne pas modifier un fichier déjà appliqué : créer un nouveau fichier si besoin de correction.
* Documenter chaque migration avec un **commentaire en début de fichier** expliquant ce qu’elle fait.

---

## 6️⃣ Vérification

Tu peux vérifier les migrations déjà appliquées :

```sql
SELECT * FROM migrations ORDER BY executed_at;
```
