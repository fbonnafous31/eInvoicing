# Jour 69 – Mock PDP : gestion des suspensions et compléments 📝⚡

Aujourd’hui, j’ai travaillé sur la **gestion des factures suspendues et de leur complément** avec le mock PDP. L’objectif est de reproduire le scénario métier où un client peut suspendre une facture, et où l’application permet ensuite de la compléter et de la réémettre.

## Gestion des suspensions et compléments

- Si le client suspend la facture, l’interface propose de réémettre la facture   
- L’utilisateur peut ajouter les justificatifs manquants et **réémettre la facture**  
- Une fois que le PDP confirme la réception de la facture complétée :  
  - Le **statut métier passe à “complété”**  
  - Le **cycle de vie de la facture reprend normalement**, jusqu’à l’encaissement  
![Facture suspendue, facture à compléter en ajoutant le justificatif additionnel demandé par le client](../images/jour69/suspendedInvoice.png)
![Facture complétée](../images/jour69/CompletedInvoice.png)
- Tous les événements sont **loggés côté backend** pour garder une trace précise de chaque étape  
- Côté frontend, l’utilisateur reçoit un **retour clair et immédiat** sur le statut de la facture complétée

## Résultat

Grâce à cette amélioration :  

- Le mock PDP supporte désormais le **flux de suspension et de complément**  
- Les tests fonctionnels peuvent couvrir **tous les cas où une facture est suspendue** et complétée  
- L’interface reste **cohérente et réactive**, même en cas de suspensions multiples

---

## 📌 Prochaines étapes

- Industrialisation du projet :  
  - Refactoring du code existant  
  - Automatisation des tests pour couvrir tous les cas métier
