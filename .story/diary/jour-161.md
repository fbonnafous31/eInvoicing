# Jour 161 — Sécurité : audits de dépendances et premiers garde-fous 🛡️🔍

Aujourd’hui, j’ai décidé de consacrer quelques sessions à un sujet que je connais un peu moins : **la sécurité de mon produit**.

Mon laboratoire, c’est eInvoicing. Et même si mon focus est souvent sur les fonctionnalités ou l’expérience utilisateur, je sais qu’un logiciel qui ne prend pas soin de ses dépendances finit par devenir fragile.

J’ai donc commencé par **les audits de dépendances**.

---

## Qu’est-ce qu’un audit de dépendances ?

Chaque projet Node.js repose sur des packages externes. Ceux-ci sont pratiques, mais parfois… vulnérables.

Un **audit de dépendances** consiste à :

* Identifier les packages qui ont des vulnérabilités connues.
* Mesurer leur gravité (critique, haute, moyenne, basse).
* Proposer des correctifs ou mises à jour.

C’est une étape cruciale parce que **même si mon code est propre, une faille dans une dépendance peut tout compromettre**.

En pratique, cela se traduit par des commandes comme `npm audit` ou des outils externes comme **Snyk**, qui analysent le `package.json` et le `package-lock.json` pour détecter des risques.

---

## Pourquoi c’est important

Plusieurs raisons :

1. **Sécurité du produit** : les vulnérabilités dans les dépendances peuvent exposer mes utilisateurs ou leurs données.
2. **Crédibilité** : un projet audité régulièrement est plus fiable, surtout si je veux montrer le sérieux de ma démarche aux investisseurs.
3. **Prévention** : corriger tôt les failles évite de se retrouver avec des mises à jour massives et potentiellement destructrices plus tard.
4. **Automatisation** : intégrer l’audit dans la CI permet de détecter les problèmes dès qu’une dépendance change.

En résumé : même si ce n’est pas visible à l’écran, c’est une **fondation invisible mais critique** pour un SaaS solide.

---

## Ce que j’ai mis en place

Pour eInvoicing, j’ai travaillé sur plusieurs points :

### 🔹 Audit automatisé dans la CI

* Ajout de commandes `npm audit --audit-level=critical` pour le **backend** et le **frontend**.
* Si une dépendance critique est détectée, le pipeline GitHub Actions échoue.
* Les développeurs ont un retour immédiat sur l’état de sécurité des packages.

### 🔹 Script dédié pour centraliser le reporting

* J’ai créé `scripts/audit/audit.sh` :

  * Génère un **fichier JSON** `audit-result.json` avec toutes les vulnérabilités.
  * Produit un **rapport Markdown** `audit-report.md` lisible et détaillé, incluant :

    * Package concerné
    * Version actuelle
    * Sévérité
    * Correctif recommandé
    * Partie concernée (backend / frontend)

* Les vulnérabilités communes aux deux parties sont fusionnées et signalées clairement.

### 🔹 Badges dans le README

* Pour donner **un signal visuel immédiat**, j’ai ajouté :

  * Couverture des tests (Codecov) ✅
  * Conformité PDF/A ✅
  * Licence MIT ✅
  * CI (GitHub Actions) ✅

Les autres badges (audit de dépendances Snyk, version npm, lint) seront configurés au fur et à mesure.

---

## Mon ressenti

En faisant cet audit, j’ai compris que :

* La sécurité, c’est d’abord de la **prévention et de la vigilance**.
* Les outils existent, et il suffit de les intégrer de façon régulière pour transformer une tâche compliquée en routine.
* Même un projet solo comme le mien peut **profiter d’une CI robuste** pour surveiller les vulnérabilités.
* Les rapports et badges apportent un **feedback visuel immédiat**, utile pour moi mais aussi pour inspirer confiance à d’éventuels investisseurs ou collaborateurs.

---

## Prochaine étape : pentesting maison

Pour aller plus loin, j’envisage de faire un peu de **pentesting “maison”** en m’inspirant du **Top 10 OWASP**. Cela permettra de :

* Vérifier les failles classiques (injection SQL/NoSQL, XSS, auth, sensitive data, etc.)
* Comprendre concrètement comment mon code et mon architecture résistent aux attaques
* Prioriser les correctifs sur ce qui est réellement critique pour mon produit

C’est un **complément naturel à l’audit de dépendances** : l’audit vérifie les packages, le pentest vérifie le code et l’environnement.

---

## Conclusion

Aujourd’hui, je me sens plus **tranquille sur la sécurité de mes dépendances**, même si certaines vulnérabilités restent à traiter.

👉 La prochaine étape : configurer le badge Snyk, compléter la couverture du lint et commencer le pentesting inspiré du Top 10 OWASP.

Mon produit reste mon laboratoire, et chaque ligne de sécurité que je pose maintenant sera un **levier de confiance et de stabilité pour la suite**.
