# Jour 9 – Boucler le CRUD et préparer les fondations

Aujourd’hui, j’ai finalisé le **CRUD complet des vendeurs**, ce qui représente une étape clé pour le projet. Après avoir créé, listé et affiché les détails d’un vendeur, j’ai implémenté :

1. **Suppression**  
   - Le bouton “Supprimer” est visible en rouge, à droite, avec un prompt de confirmation.  
   - Côté backend, la suppression physique (`DELETE FROM invoicing.sellers WHERE id = $1`) fonctionne.  
   - Après suppression, la redirection vers la liste des vendeurs est automatique et fluide.

2. **Modification (update)**  
   - Le bouton “Modifier” sur la fiche détail permet de passer le formulaire en mode édition.  
   - Les modifications sont validées puis envoyées au backend via `PUT`, avec mise à jour dans la base et retour visuel immédiat.  
   - Cela boucle enfin le CRUD : création, lecture, mise à jour, suppression.

3. **Validation SIRET** pour les vendeurs français  
   - Le formulaire contrôle que l’identifiant légal correspond à un SIRET valide (14 chiffres, algorithme de Luhn).  
   - Les espaces dans la saisie sont ignorés pour la validation et pour l’enregistrement en base.  
   - Les erreurs sont affichées côté frontend sans altérer la saisie de l’utilisateur.

Cette étape m’a permis de **sentir que le projet a maintenant une vraie structure solide** :  

- Le CRUD est complet, côté frontend et backend.  
- Les validations métier sont intégrées dès le départ.  
- Les fonctions utilitaires comme `isValidSiret` sont réutilisables facilement.  

Pour la suite :  

- Créer une **entité client** pour compléter le processus de facturation, aux côtés du vendeur.  
- Consolider les validations et les flux pour que chaque acteur (vendeur et client) soit correctement géré dans l’application. 🚀
