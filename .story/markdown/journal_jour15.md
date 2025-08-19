# Jour 15 – Lignes, TVA et réflexions autour du produit 🧾🌿

Aujourd’hui, j’ai franchi une nouvelle étape dans le projet **eInvoicing** : la **gestion des lignes de facture et des assiettes de TVA**. Côté frontend, tout est dynamique, avec calcul automatique des montants HT, TVA et TTC, et un formulaire agréable à remplir. Le backend est opérationnel, avec l’insertion des lignes, taxes et justificatifs dans les tables appropriées et la séquence PostgreSQL resynchronisée pour éviter les doublons d’ID.

---

## 🎯 Objectifs atteints

- Validation et **affichage dynamique des lignes de facture** avec calculs intégrés.  
- Gestion des **assiettes de TVA** dans la table dédiée `invoice_taxes`.  
- Alignement du **bouton “Créer la facture”** pour améliorer l’UX.  
- Flux complet de création côté backend avec transaction sécurisée pour assurer l’intégrité des données.

---

## 💻 Côté frontend

1. **InvoiceLines** : saisie intuitive des lignes avec champs calculés en lecture seule (HT, TVA, TTC).  
2. **TaxBases** : gestion des assiettes de TVA avec calcul automatique du montant de taxe.  
3. **Formulaire global (`InvoiceForm`)** : centralisation des données dans `invoiceData` pour l’entête, les lignes, taxes et justificatifs.  
4. **Optimisations UX** : alignement du bouton, lisibilité des champs et placeholders, feedback immédiat après création.  

---

## 🛠 Côté backend

- Routes `/api/invoices` prêtes à recevoir l’ensemble des données.  
- Séquences PostgreSQL synchronisées pour éviter les conflits d’ID.  
- Transactions sécurisées pour garantir que l’insertion des lignes, taxes et justificatifs est atomique.  

---

## 🌿 Pause et équilibre

Ce weekend, j’ai pris un petit break pour **profiter de mes copains d’enfance et de leurs familles**, dans un cadre magnifique autour d’un lac. Ces moments m’ont permis de **déconnecter**, de respirer et de revenir lundi avec l’esprit clair et motivé. Même dans un projet exigeant, il est essentiel de garder un équilibre entre travail et vie personnelle.

---

## 💡 Réflexions autour du produit

En avançant sur ce projet, j’ai eu un déclic : **le développement n’est qu’un composant d’un système plus vaste**.  

Créer un produit, c’est assembler plusieurs couches :  

- **La tech** : code propre, architecture solide, bonnes pratiques.  
- **Le produit** : définir l’objectif, prioriser, penser à l’expérience utilisateur.  
- **Ops** : déploiement, sécurité, monitoring.  
- **Marketing & positionnement** : faire savoir que le produit existe, convaincre, fidéliser.  
- **Partenariats** : s’intégrer dans un écosystème, trouver des relais de croissance.  

Chaque choix technique peut influencer la perception marketing, et un choix UX bien pensé peut transformer l’adoption.

---

## 🚀 Prochaines étapes

- Poursuivre la **gestion des justificatifs** (`invoice_attachments`) avec upload et typage (`main` / `additional`).  
- Tester l’insertion complète des données dans le backend pour valider la cohérence globale.  
- Commencer à **réfléchir à l’optimisation UX** pour limiter les erreurs de saisie et améliorer la fluidité du formulaire.  

✅ Résultat : **les lignes et assiettes de TVA sont opérationnelles**, le backend sécurisé, et une vision claire du produit se dessine, enrichie par des moments de déconnexion bienvenus.
