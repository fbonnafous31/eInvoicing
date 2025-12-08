# Jour 166 --- Réflexion sur la souveraineté d'eInvoicing 🇫🇷🛡️

## Notions expliquées

### 🔒 Vendor lock-in

Le **vendor lock‑in** est une situation où ton application dépend
tellement d'une technologie ou d'un service tiers qu'il devient
compliqué, coûteux ou parfois impossible d'en changer.

Exemples : - Une base de données propriétaire non exportable. - Une API
d'hébergement qui gère tout et ne fonctionne que dans son propre
cloud. - Un service de stockage ou d'authentification impossible à
remplacer.

L'objectif est d'éviter d'être « enfermé » chez un fournisseur.

### 💻 VPS (Virtual Private Server)

Un **VPS** est un serveur virtuel loué chez un hébergeur (OVH, Scaleway,
Hetzner...). Tu y installes ce que tu veux : - ta base de données, - tes
containers Docker, - ton backend, - ton frontend.

C'est un **serveur à toi**, mais hébergé ailleurs.

### 🏗️ Amazon-level SRE

Le terme désigne le niveau d'ingénierie et d'opérations utilisé par des
géants comme Amazon, Google ou Netflix : - disponibilité 99.99% -
équipes 24/7 - multi‑région - monitoring à très grande échelle -
automatisation extrêmement avancée

C'est disproportionné pour un solo‑dev, mais utile comme culture
générale.

------------------------------------------------------------------------

# Jour 166 --- Réflexion sur la souveraineté d'eInvoicing 🇫🇷🛡️

Aujourd'hui, j'ai pris du recul sur mon application **eInvoicing** pour
réfléchir à un sujet essentiel :\
**la souveraineté technique et opérationnelle** de ce que je construis
depuis plusieurs mois.

Ce terme est souvent utilisé dans les sphères institutionnelles ou
industrielles, parfois avec un ton un peu "cloud souverain" ou
"Amazon-level SRE".\
Mais en réalité, il existe une souveraineté **à taille humaine**,
adaptée à un éditeur solo, agile, capable de maîtriser sa stack sans
s'appuyer sur des services opaques ou verrouillants.

Et c'est exactement là que se situe mon application.

## 🌱 Ce que j'estime déjà souverain dans eInvoicing

### 1. Contrôle total des données

Les données restent **chez moi**, dans une base PostgreSQL maîtrisée,
sauvegardée, et exportable.\
Aucun service tiers critique. Aucun verrou.

### 2. Industrialisation par containers Docker

À chaque commit, une image est produite.\
C'est reproductible, traçable, et **déployable partout**.

### 3. Agnosticisme total

L'application ne dépend : - ni d'un serveur de fichiers particulier\
- ni d'un hébergeur\
- ni d'une plateforme agréée spécifique

Elle peut tourner en local, sur un VPS, dans un datacenter interne, ou
sur une infra publique.

### 4. Supervision avec Loki + Promtail + Grafana

Après le travail d'hier (Jour 165), j'ai maintenant une vision **claire
et centralisée** des logs.

### 5. Observabilité système via Prometheus + Grafana

Métriques, dashboards, état des containers...\
Je peux voir **en temps réel** comment se comporte mon application.

### 6. Backups opérationnels de la base PostgreSQL

Restauration testable, sauvegardes exportables.\
La donnée est durable.

### 7. Rollbacks simplifiés

Si une nouvelle version crée un problème, je redeploie l'image
précédente.\
Pas d'usine à gaz, pas de panique.

## 🔍 Ce qui manque pour encore plus de souveraineté

### 1. Alerting

-   container down\
-   DB non joignable\
-   montée d'erreurs dans les logs\
-   pics de CPU / RAM

### 2. Documentation des procédures d'incidents

-   restauration DB\
-   rollback\
-   diagnostic d'incident

### 3. Rotation des secrets

Automatiser ou définir une fréquence.

## 🌤️ Mon ressenti

Je pensais être loin du compte, mais en réalité mon architecture est
**sobre, maîtrisée, portable et reproductible**.\
C'est exactement la souveraineté à l'échelle d'un éditeur indépendant.

## 🎯 Prochaine étape

-   Mettre en place un **Alertmanager**\
-   Documenter les procédures\
-   Automatiser la rotation des secrets

eInvoicing n'est pas encore en production --- mais tout est en place
pour qu'il devienne un service **fiable, robuste et souverain**.