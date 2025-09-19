# Jour 76 – Dashboard vendeur opérationnel 🚀📊

Aujourd’hui, j’ai finalisé le **Dashboard vendeur** pour eInvoicing, en centralisant toutes les informations essentielles pour permettre au vendeur de suivre rapidement l’état de ses factures.  

## Parcours utilisateur 🧾

- Le dashboard vérifie d’abord si l’utilisateur dispose d’une fiche vendeur.  
  - Si ce n’est pas le cas, l’utilisateur est redirigé vers la création de sa fiche.  
  - Sinon, toutes les factures associées au vendeur sont récupérées via `fetchInvoicesBySeller`.  
- L’objectif est de présenter uniquement les données pertinentes et de garantir une expérience utilisateur fluide.

## Statuts et graphiques 📊

- Les **statuts des factures** sont affichés dans un tableau avec **codes couleurs** pour identifier rapidement les factures en cours, suspendues ou en litige.  
- Un **graphique en barres** présente uniquement les statuts actifs (204 à 210).  
- Chaque statut ou facture est **cliquable**, permettant d’accéder directement à la liste filtrée correspondante.  

## Top clients et chiffres clés 💵🏆

- Le **Top 5 clients** est calculé en fonction du montant total facturé.  
- Un **graphique mensuel** présente l’évolution des montants facturés.  
- Les factures annulées ou inactives sont exclues, pour ne refléter que les données opérationnelles.

## Factures en retard 🔴

- Les factures en retard sont identifiées selon la règle française : `issue_date + 30 jours`.  
- Les factures avec un statut `pending` ou `rejected` sont exclues.  
- Les factures concernées sont affichées avec une **bulle colorée représentant le statut** et un lien direct vers la facture correspondante.  
- Cela fournit un **signal visuel immédiat** pour prioriser les actions.

## Optimisations UX ✨

- Les **tags de statut** sont codés en couleurs distinctes pour faciliter la lecture rapide.  
- Les icônes et espacements sont ajustés pour une interface claire et cohérente.  
- La disposition en trois colonnes (statuts, graphique, factures en retard) est **responsive**, garantissant une visualisation optimale sur tous les écrans.

✅ Le Dashboard est désormais un **centre de contrôle complet**, combinant suivi analytique et navigation opérationnelle.
