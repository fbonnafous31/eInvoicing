# Jour #182 – Encaissement validé 💰

## Front : bouton encaissement
Le bouton est maintenant cohérent avec la réalité métier :  
- Activé dès que la facture est transmise (`received` ou `validated`)  
- Désactivé si la facture est refusée (`210`)  
- Plus besoin d’attendre le `211` qui n’arrive jamais en B2C  
- Design simple, clair et UX friendly

## Backend / Adapter SuperPDP
La fonction `sendStatus` a été adaptée pour utiliser **le `submission_id` réel** de PDP :  
- `invoice_id` envoyé en entier  
- `status_code` préfixé avec `fr:`  
- Logs complets pour suivre exactement ce qui est transmis

## Tests
- Envoi forcé sur un `submission_id` valide pour simuler une facture encaissée  
- Envoi du statut `fr:212` réussi  
- Logs montrent le JSON envoyé et la réponse de PDP → tout est traçable et clair

## Constat / douleur
- Certaines factures restent invalides côté PDP et renvoient des 500 si on tente de les marquer encaissées  
- Probablement lié à la séquence d’événements ou à des statuts intermédiaires jugés incorrects par la plateforme  
- Le mécanisme fonctionne parfaitement sur les factures correctes

## Conclusion
Le parcours encaissement est fonctionnel et testable.  
Reste à gérer proprement les cas “statut invalide” pour éviter les erreurs côté PDP.  

Petit pas pour le code, mais un grand pas pour le cashflow. 😎