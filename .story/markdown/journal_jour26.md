# Jour 26 – Refactor seller, IBAN/BIC, validations améliorées 🛠️✨

Aujourd'hui, je me suis concentré sur l'amélioration du module **Seller** pour :

- Supprimer le champ `bank_details` et le remplacer par `iban` et `bic`.
- Mettre à jour le **backend** et le **validator** pour prendre en compte ces nouveaux champs.
- Prendre en compte la validation IBAN et BIC côté frontend.
- S'assurer que les **sections du formulaire** s'ouvrent automatiquement lorsqu'il y a des erreurs.
- Harmoniser les labels pour l'utilisateur (`registration_info` → "Registre du commerce et des sociétés").
- Nettoyage et refactor léger du `useSellerForm` et du `SellerForm`.

## Backend

- Suppression de `bank_details`.
- Ajout de `iban` et `bic` dans les fonctions CRUD de `sellers.model.js`.
- Adaptation des payloads pour insérer et mettre à jour les nouvelles colonnes.

## Frontend

- Mise à jour de `FinanceFields.jsx` : suppression de `bank_details`, ajout de `iban` et `bic`.
- `useSellerForm.js` mis à jour pour gérer `iban` et `bic`.
- Validation IBAN et BIC dans `validators/seller.js`.
- `SellerForm.jsx` corrigé pour que les sections contenant des erreurs s’ouvrent automatiquement.
- Nettoyage et simplification de la logique de `handleSubmit`.

## Notes techniques

- L’IBAN et le BIC sont maintenant validés côté frontend pour éviter les erreurs de saisie.
- Les sections “legal”, “contact”, “address” et “finances” se comportent dynamiquement en cas d’erreur.
- La logique du SIRET est conservée, avec nettoyage automatique des espaces et des caractères non numériques.

