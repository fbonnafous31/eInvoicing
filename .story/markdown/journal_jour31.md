# Jour 31 – Architecture du formulaire de facture 🏗️🧩

Aujourd’hui, j’ai pris un peu de recul pour me concentrer sur **l’architecture globale du formulaire de facture**.  
Ce chantier est devenu un vrai **squelette applicatif** : il assemble plusieurs briques (lignes, taxes, justificatifs, client) qui doivent dialoguer sans se marcher dessus.

---

## ✅ Ce qu’on a fait

- **Structure du formulaire clarifiée** :  
  - Séparation claire entre les sections : **Header, Client, Lignes, TVA, Justificatifs**.  
  - Chaque bloc reste autonome, mais tous partagent un même état centralisé pour assurer la cohérence.  

- **Gestion des interactions** :  
  - Lorsqu’un champ change (date, lignes, TVA, etc.), les données remontent correctement vers le parent (`InvoiceForm`).  
  - Mise en place de validations ciblées sur certains champs stratégiques (numéro de facture, exercice fiscal, email client).  

- **Bloc Client en réflexion** :  
  - Intégration progressive d’un composant dédié pour la saisie/recherche client.  
  - Règles de gestion différenciées selon le type de client (particulier / entreprise France / entreprise étranger).  

- **Complexité assumée** :  
  - Le formulaire n’est plus un simple “formulaire CRUD” : il orchestre **plusieurs tables liées** (facture, client, lignes, TVA, justificatifs).  
  - Ce choix complexifie un peu la logique, mais garantit une vraie solidité pour l’avenir.  

---

## 💪 Le résultat

- Une **ossature claire** du formulaire de facture, sur laquelle on peut bâtir proprement les prochaines étapes.  
- Des blocs modulaires, faciles à faire évoluer (ajout d’un champ, validation spécifique, nouvelle règle métier).  
- Un code plus lisible qui évite l’“usine à gaz” malgré la richesse fonctionnelle.  

---

## 📌 Prochaines étapes

- Finaliser le **bloc Client** (saisie, validation, mise à jour automatique dans la base).  
- Ajouter un design plus ergonomique pour séparer visuellement chaque section.  
- Gérer le bouton **Enregistrer** pour orchestrer : création de facture + mise à jour client.  
- Continuer à renforcer la **robustesse des validations** sans perdre en fluidité de saisie.  

---

👉 On sent que le formulaire devient une pièce centrale de l’application : complexe, mais bien cadrée.
