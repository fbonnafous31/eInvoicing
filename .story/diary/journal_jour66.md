# Jour 66 – Mock PDP : cycles pondérés, suspension et encaissement ⚖️💰

Aujourd’hui, j’ai travaillé à rendre le mock PDP encore plus réaliste et robuste. Après les premiers tests sur l’encaissement et le bouton 💰, j’ai ajouté deux améliorations majeures :

## Pondération des cycles de vie

Chaque statut métier (mise à disposition, prise en charge, approuvée, litige, suspension, refus, paiement transmis) dispose désormais d’une probabilité d’occurrence.

Cela permet de simuler des flux plus proches de la réalité, avec des parcours non linéaires et des probabilités différentes pour chaque événement.

## Gestion de la suspension

Les factures suspendues (statut 208) attendent désormais un complément avant de continuer le cycle.

La progression automatique est bloquée jusqu’à ce que la suspension soit levée, ce qui reflète la réalité où certains documents ou informations sont obligatoires pour continuer.

---

Grâce à ces améliorations, j’ai pu retester tous mes parcours critiques :

- Création facture → envoi au PDP → rejet PDP  
- Création facture → envoi au PDP → intégration PDP → statuts successifs → rejet client → fin du cycle de vie  
- Création facture → envoi au PDP → intégration PDP → statuts successifs → suspension → attente complément  
- Création facture → envoi au PDP → intégration PDP → statuts successifs → paiement transmis → envoi flux d’encaissement

Le mock permet désormais :

- De suivre tous les scénarios possibles, du rejet technique à l’encaissement final  
- De valider mes règles métier, y compris suspension, rejet et encaissement  
- De vérifier que l’interface réagit correctement à chaque évolution de cycle (rafraîchissement, boutons désactivés/activés, notifications)

Même minimaliste, ce mock est devenu un outil stratégique : il fournit un terrain de test réaliste, force à anticiper tous les cas particuliers et assure que le MVP repose sur des fondations solides.

---

## 📌 Prochaines étapes

Pour continuer à améliorer le mock et le parcours factures :

- Gérer le retour de l’envoi d’un statut, notamment l’encaissement, côté front et backend  
- Traiter les erreurs techniques des requêtes côté PDP (ex. erreur 500) et simuler ces scénarios  
- Ajouter les commentaires clients pour les statuts particuliers : refus, approbation partielle ou litige  
- Afficher des messages d’erreurs techniques côté frontend : bulles d’aide ou alertes lors d’un rejet technique ou d’un refus de facture  

Ces améliorations permettront de tester tous les cas extrêmes et d’anticiper les interactions front/back avant la mise en production.
