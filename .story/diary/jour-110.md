# 🧭 Jour 110 – Ne pas dépendre d’un seul pilier 🧩  

J’ai lu récemment un post sur LinkedIn d’un auteur dont j’aime beaucoup la manière de penser.  
Il racontait comment il s’était retrouvé **piégé par son fournisseur de mails**, qui avait augmenté ses tarifs sans qu’il ait vraiment le choix.  
Son produit dépendait directement de ce service — impossible de changer sans tout casser.  

Cette histoire m’a parlé.  
Je ne vends pas encore un produit, je construis un **MVP**.  
Mais je me suis rendu compte que, mine de rien, **j’étais moi aussi dépendant de beaucoup d’outils tiers**.  

---

## 💭 La question de la dépendance  

Quand on démarre un projet, on va souvent au plus simple.  
J’ai choisi des outils “plug and play” pour aller vite :  
- Authentification via un service externe,  
- Déploiement via Render,  
- CI/CD, hébergement de code et suivi via GitHub,  
- Tests de couverture avec Codecov.  

Tout est fluide, gratuit, bien intégré.  
Mais si demain GitHub rend certains services payants ?  
Ou si un incident comme celui d’OVH se reproduit ?  
Le projet, sa CI, son historique — tout pourrait devenir **inaccessible**.  

Je ne dramatise pas, mais j’ai pris conscience que la **souveraineté technique** commence bien avant la mise en production.  
Même à ce stade, je veux pouvoir dire :  
> “Mon projet ne tient pas debout uniquement parce que quelqu’un d’autre le porte.”  

---

## ⚙️ Ce que j'ai mis en place aujourd’hui  

Pour franchir une première étape concrète, j'ai mis en place un **miroir automatique entre GitHub et GitLab**.  
Objectif : garantir un **backup sécurisé et autonome** du code source.  

### 🔐 Création d’un token GitLab  
- Génération d’un **personal access token** sur GitLab.  
- Ajout de ce token dans les **GitHub Secrets**, sous le nom `GITLAB_TOKEN`.  
- Il permet à GitHub d’envoyer les mises à jour vers GitLab sans mot de passe.  

### ⚙️ Workflow GitHub Actions  
Création du fichier `.github/workflows/mirror-to-gitlab.yml` :  
- S’exécute à chaque `push` (et aussi manuellement si besoin).  
- Récupère l’historique complet (`fetch-depth: 0`).  
- Pousse automatiquement le code sur GitLab (`force push` activé sur `main`).  

### 🧠 Résolution des blocages  
- Correction de l’erreur `shallow update not allowed` en important tout l’historique.  
- Test complet : GitHub → GitLab → synchro réussie 🎯  

---

## 💾 Résultat final  

À chaque `git push` sur GitHub, le code est **instantanément copié sur GitLab**.  
Aucune action manuelle nécessaire, aucune dépendance unique.  

C’est un petit pas, mais un vrai **geste d’indépendance**.  
Et paradoxalement, plus le projet grandit, plus ces gestes simples prennent de la valeur.  

---

## 🔁 Bilan du jour  

Ce que j’ai retenu : la **résilience** ne s’improvise pas.  
Elle se construit, commit après commit.  

eInvoicing n’est pas qu’un projet open-source, c’est aussi une démarche :  
celle d’un développeur qui veut **rester maître de son outil, de son code et de ses choix**.  

---  

💬 **Citation du jour :**  
> “La liberté technique, ce n’est pas d’utiliser tout ce qu’on veut,  
> c’est de pouvoir continuer à avancer si quelque chose s’arrête.”  