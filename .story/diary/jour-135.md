# Jour 135 – Génération propre des environnements et stabilisation du schéma DB 🏗️🌿

Après avoir rendu mon backend **agnostique du schéma** grâce à `DB_SCHEMA`, l’étape suivante était de **mettre en place des environnements propres et reproductibles** autour de ma base Render.  
L’objectif : **pouvoir créer un nouvel environnement** (staging, preprod, tests, etc.) sans bricolage ni copie sauvage de données.

---

## 🧱 Construire un environnement à partir d’un schéma de référence

Plutôt que d’utiliser un dump complet (avec données), j’ai préféré repartir d’un **schéma de référence** sain :

1. **Exporter le schéma `invoicing`** depuis DBeaver (structure uniquement, pas les données).
2. Ouvrir le fichier SQL généré (`db_schema.sql`).
3. **Remplacer toutes les occurrences** de `invoicing.` par `staging.`.

```bash
sed -i 's/invoicing\./staging./g' db_schema.sql
```

→ Résultat : un script capable de **recréer le schéma staging à l’identique**, aligné sur la structure principale.

> Et surtout : **plus besoin de re-taper des commandes manuelles** ou de vérifier table par table.

---

## 🔁 Cohérence multi-environnements

Ce travail pose les bases de ce que je veux pouvoir faire facilement :

| Action | Avant | Maintenant |
|-------|-------|------------|
| Créer un nouvel environnement | Délicat, manuel, risqué | Simple, reproductible, automatisable |
| Synchroniser la structure | Risque d’oublis | Alignement garanti depuis un schéma source |
| Tester sans casser la prod | Complexe | Transparent, naturel |

> J’ai maintenant une **mécanique stable pour scaler** mon architecture autour d’une seule DB Render avec plusieurs schémas isolés.

---

## 🛠 Détail bonus : correction de l’envoi d’emails

J’en ai profité pour régler un petit problème qui traînait :  
ma fonction d’envoi d’email **recryptait la clé** si le vendeur était modifié — ce qui cassait plus ou moins silencieusement l’envoi.

Ce bug est maintenant réglé ✅  
→ La clé est reconnue si elle est déjà encryptée.  
→ L’état du vendeur reste cohérent.  
→ L’envoi de mail est stable et predictable.

---

## 🌱 Bilan du jour

Une avancée **structurante** :  
Je peux maintenant **déployer, tester, corriger, itérer** dans de nouveaux environnements **sans prise de tête**.

- Schémas reproductibles ✅  
- Architecture prête à scaler ✅  
- Moins d’entropie, plus d’intention ✅  

> Ce sont des choses qu’on ne remarque pas dans l’interface,  
> mais qui font **toute la différence** dans la vie du projet.

On avance. Tranquillement mais sûrement 🚀