# Jour 141 – Déployer eInvoicing localement, stable et automatique 🖥️🚀

Aujourd’hui, l’objectif était de **rendre l’application eInvoicing complètement accessible en local**, avec une adresse stable, **sans port**, et **démarrage automatique au boot**, comme si c’était un vrai SaaS mais sur mon PC.

---

## 🧩 Pourquoi cette session

* Pouvoir **accéder à l’application via une URL stable** (`http://e-invoicing.local`) même sur un poste local.
* Faciliter les tests de développement **sans passer par localhost:port** ni devoir reconfigurer Auth0 à chaque fois.
* Préparer le terrain pour **déployer sur n’importe quelle machine** sans intervention manuelle répétitive.
* Assurer un **démarrage automatique**, pour que l’environnement soit prêt dès que la machine est allumée, **comme un serveur distant**.

> L’idée est de créer un **environnement local robuste, stable et portable**, pour se rapprocher de la qualité d’un hébergement cloud tout en restant sur son PC.

---

## 🛠️ Travail technique effectué

1. **Configuration du domaine local**

   * Ajout de `127.0.0.1 e-invoicing.local` dans `/etc/hosts`.
   * Vérification que l’adresse est bien résolue par `getent hosts`.

2. **Mise en place de Docker pour le projet**

   * Vérification que Docker et Docker Compose sont installés et démarrent automatiquement.
   * Test du démarrage des conteneurs : backend, frontend et base de données PostgreSQL.

3. **Gestion des domaines Auth0 pour le local**

   * Configuration des `Allowed Callback URLs` et `Allowed Web Origins` pour inclure `http://e-invoicing.local`.
   * Correction de la redirection HTTPS pour éviter les erreurs `Callback URL mismatch`.
   * Vérification du runtime configuration du frontend (`window.__ENV__`) pour que le client Auth0 pointe sur la bonne URL.

4. **Création d’un service systemd pour démarrer l’environnement automatiquement**

   * Fichier `/etc/systemd/system/einvoicing.service` avec `ExecStart` et `ExecStop`.
   * Ajustement pour utiliser le chemin correct vers `docker-compose` (`/usr/local/bin/docker-compose`).
   * Configuration avec `Restart=always` pour que l’application reste **toujours active**, même après reboot.

5. **Documentation et mise à jour de guides**

   * Création d’un guide complet pour la **mise en place locale automatique**, incluant Docker, systemd et Caddy pour masquer le port.
   * Explication claire du **pourquoi** de chaque étape : stabilité, portabilité, accès local sans complications.

---

## 🌱 Points humains / ressentis

* Faire en sorte que tout soit **automatique et stable** réduit le stress des tests et des démos.
* La configuration locale reflète ce que **les clients finaux pourraient vivre**, mais de façon beaucoup plus flexible pour le développement.
* Même si ce n’est pas visible dans l’interface, c’est **une fondation technique essentielle** : la prochaine fois que j’ajouterai une feature, elle sera directement testable dans un environnement réaliste.

---

## ✅ Bilan du jour

* URL locale stable : ✅ `e-invoicing.local`
* Conteneurs Docker prêts et automatisés : ✅ backend, frontend, DB
* Auth0 configuré pour le local : ✅ callback et web origin corrects
* Service systemd pour démarrage automatique : ✅ lancement dès le boot
* Documentation complète mise à jour : ✅ pour référence future et partage

> Avec tout cela, **l’application fonctionne comme un vrai SaaS sur mon PC**, prête à être utilisée ou testée, sans jamais avoir à toucher à la configuration à chaque session.
