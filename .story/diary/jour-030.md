# Jour 30 – Validation et robustesse des erreurs 🛡️✨

Aujourd’hui, j’ai poursuivi le chantier sur la partie **“Facture”**, mais cette fois en me concentrant sur **la validation et la robustesse des erreurs**, pour que l’utilisateur ne se retrouve jamais avec un message technique confus.

---

## ✅ Ce qu’on a fait

- **Validation des lignes de facture** :  
  - Chaque champ obligatoire est maintenant vérifié **avant le submit**.  
  - Les montants HT, TVA et TTC se recalculent automatiquement à chaque modification.  
  - Les erreurs sont affichées **inline** et bloquent la création si nécessaire.  

- **Exercice fiscal synchronisé avec la date d’émission** :  
  - Si l’utilisateur change la date d’émission, l’exercice fiscal se met à jour automatiquement.  
  - Correction des cas où l’ancien exercice restait figé malgré la modification de la date.  

- **InvoiceHeader et InvoiceLines stabilisés** :  
  - Les hooks et states sont simples, clairs et robustes.  
  - Les erreurs de champs s’affichent au bon moment (blur + submit) pour une UX cohérente.  

- **ErrorHandler backend réfléchi** :  
  - Les contraintes critiques de la DB sont maintenant mappées pour éviter que l’utilisateur voie des messages bruts.  
  - Les contraintes sur les clés étrangères ne sont pas remontées côté front car elles sont déjà gérées par la logique métier.  

---

## 💪 Le résultat

- Une facture qui se **remplit sans surprise**.  
- Les erreurs sont **prévisibles et user-friendly**.  
- Les montants, taxes et exercice fiscal sont **toujours cohérents**.  
- Le code reste **lisible, maintenable et prêt pour les prochaines améliorations**.  

---

## 📌 Prochaines étapes

- Créer un **bloc Client** au niveau du formulaire de création de facture permettant de stocker les données clients :  
  - **Workflow** :  
    - Rechercher le client dans la table `client`, compléter les informations si nécessaire et mise à jour des données client dans la table `client`.  
    - Si le client n’existe pas : saisie manuelle des informations et création du client dans la table `client`.  
  - **Règles de gestion** :  
    - Le client est un particulier → Nom, prénom et adresse sont obligatoires.  
    - Le client est une entreprise domiciliée en France → SIRET et adresse sont obligatoires.  
    - Le client est une entreprise non domiciliée en France → TVA intracommunautaire et adresse sont obligatoires.
