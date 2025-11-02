# Jour 136 – Déploiement de l’environnement preprod sur Render 🚀🟡

Aujourd’hui, j’ai passé une étape importante : la mise en place d’un **environnement preprod** dédié.  
L’objectif est clair : **ouvrir progressivement l’application à des bêta‑testeurs** dans un espace isolé, stable et reproductible.

---

## 🌍 Pourquoi une preprod maintenant ?

J’avais déjà un environnement *staging* pour mes tests internes.  
Mais pour inviter des utilisateurs réels à tester l’application, il faut :

- **un environnement séparé**, stable et persistant
- **une base de données dédiée**, dérivée proprement du schéma principal
- **une configuration Auth0 isolée** pour éviter la confusion des espaces utilisateurs

La preprod devient **le pont** entre mon environnement de développement *et* la future version réellement utilisée par des clients.

---

## 🏗️ Création de l’environnement sur Render

En m’appuyant sur la logique mise en place hier (schéma reproductible via fichier SQL), j’ai pu :

1. **Créer une nouvelle base (schéma)** sur la DB Render existante : `preprod`
2. Générer le schéma depuis mon fichier `db_schema.sql`
3. Déployer un **nouveau service Render** depuis le même code front + backend
4. Configurer les variables d’environnement proprement

→ Résultat : un environnement **cohérent**, aligné avec staging, isolé, et reproductible.

---

## 🔐 Prochaine étape : Auth0 dédié

Pour l’instant, l’environnement preprod **partage encore le tenant Auth0** du staging.  
Ce n’est pas bloquant, mais **ce n’est pas idéal** pour gérer des testeurs.

### Ce que je vais faire ensuite :
- Créer un **nouveau tenant Auth0** (`eInvoicing-preprod`)
- Reconfigurer les applications (frontend + backend)
- Synchroniser les règles RBAC
- Mettre en place un **bash script** pour générer automatiquement les variables d’env

Ce sera l’occasion d’avoir **un espace utilisateur complètement séparé**, ce qui simplifie énormément la gestion du cycle de vie.

---

## ✅ Bilan du jour

Une journée moins « visible », mais très structurante :

- Environnement preprod en ligne ✅
- DB clean, reproductible et alignée ✅
- Déploiement simplifié ✅
- Direction bêta‑testeurs ouverte ✅

> On se rapproche concrètement de **mettre l’application dans les mains de vrais utilisateurs**.
> Chaque étape rend le projet plus réel, plus solide, plus prêt.

On avance. Toujours. 🌱🔥