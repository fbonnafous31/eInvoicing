# PostgreSQL Dump Cheat Sheet

Un guide rapide pour créer et restaurer des dumps PostgreSQL.

---

## 1️⃣ Variables d’environnement (optionnel)

Pour éviter de saisir le mot de passe à chaque fois :

```bash
export PGPASSWORD='MON_MDP_DB'
```

---

## 2️⃣ Créer un dump **structure seule** (schéma)

```bash
pg_dump -h localhost -p 5432 -U francois -d einvoicing --schema-only -f einvoicing_structure.sql
```

> ✅ Inclut toutes les tables, vues, indexes, triggers
> ❌ Pas les données

---

## 3️⃣ Créer un dump **complet** (structure + données)

**La commande ultime :**

```bash
pg_dump -h localhost -p 5432 -U francois -d einvoicing -F c -b -v -f einvoicing_full.dump
```

* `-F c` → format compressé (custom)
* `-b` → inclut les blobs
* `-v` → mode verbeux
* `-f` → fichier de sortie

> ✅ Dump complet prêt pour restauration

---

## 4️⃣ Restaurer un dump

### a) Structure seule

```bash
psql -h localhost -p 5432 -U francois -d NEW_DB -f einvoicing_structure.sql
```

### b) Dump complet compressé

```bash
pg_restore -h localhost -p 5432 -U francois -d NEW_DB -v einvoicing_full.dump
```

---

## 5️⃣ Astuces

* Pour tester sans écraser ta DB existante :

```bash
createdb -h localhost -p 5432 -U francois einvoicing_test
psql -h localhost -p 5432 -U francois -d einvoicing_test -f einvoicing_structure.sql
```

* Versionner ton schéma dans Git avec le dump **structure seule**.
* Toujours faire un backup avant de restaurer un dump sur une DB active.

---

## 🎯 Rappel

La commande ultime pour un dump complet et compressé :

```bash
pg_dump -h localhost -p 5432 -U francois -d einvoicing -F c -b -v -f einvoicing_full.dump
```
