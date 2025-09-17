# Jour 68 – Mock PDP : gestion des erreurs 400/500 et robustesse front/back ⚡🛠️

Aujourd’hui, j’ai travaillé sur la **robustesse du mock PDP** et la **gestion des erreurs côté front et backend**. L’objectif est de s’assurer que les incidents liés à la plateforme de facturation (mock ou réelle) n’interrompent pas le flux de travail et fournissent un retour clair à l’utilisateur.

## Gestion des erreurs 400 et 500

Le backend capte désormais correctement :

- Les erreurs client (400, 404) : soumission non trouvée, requête invalide  
- Les erreurs serveur (500, 503, etc.) : PDP indisponible, crash simulé  

Toutes les erreurs sont loggées côté backend pour faciliter le dépannage, et un **message standard est envoyé au frontend** pour informer l’utilisateur qu’il doit réessayer plus tard.

## Comportement côté frontend

Le frontend ne se base plus sur un statut optimiste immédiat pour l’encaissement :  

- Si le PDP/mocking PDP renvoie une erreur, le **statut ne change pas**  
- L’utilisateur reçoit un **message d’alerte clair et uniforme**  
- Les logs détaillés restent côté backend, pour ne pas surcharger l’expérience utilisateur  

## Résultat

Grâce à ces modifications, le mock PDP est désormais plus **réaliste et résilient** :  

- Les flux critiques (création, envoi au PDP, statuts successifs, encaissement) peuvent être testés même si la plateforme est indisponible  
- L’interface frontend ne plante plus et l’utilisateur est correctement informé  
- Les logs backend permettent un suivi précis et rapide en cas de problème  

---

## 📌 Prochaines étapes

- Finaliser le périmètre métier avec la gestion des compléments de facture
- Améliorer la qualité du code suite à tous les changements

Avec ces améliorations, le mock PDP est désormais un outil robuste pour **tester tous les cas extrêmes** et anticiper les interactions front/back avant la mise en production.
