# Jour #184 – Premiers pas vers la facture d’acompte 💰

## Pourquoi la facture d’acompte ? 🤔

Jusqu’ici, toutes mes factures étaient **standard**, ce qui suffisait pour des paiements classiques.
Mais dès qu’un client paye **en plusieurs fois**, il devient nécessaire de distinguer **l’acompte du solde** :

* La facturation classique ne permet pas de tracer correctement **qui a payé quoi et quand**.
* Le PDF ne reflète pas la réalité si un acompte est versé.
* Le formulaire n’avait pas de champ pour saisir le type de facture.

Bref, pour rendre mon application **complète et réaliste**, il fallait **introduire le concept de facture d’acompte**.
C’est donc une évolution naturelle de la logique de facturation que j’ai déjà construite : on part d’une facture simple et on ajoute le type pour gérer **tous les scénarios de paiement**.

## Comment j’ai commencé 🛠️

1. **Ajout du champ `invoice_type` en base**

   * Migration SQL pour ajouter `invoice_type` aux factures.
   * Script pour remplir les anciennes factures avec `'standard'` par défaut.

2. **Formulaire frontend mis à jour**

   * Nouveau champ `SelectField` pour choisir le type : facture, acompte ou solde.
   * Valeur par défaut `'standard'` pour les nouvelles factures.
   * Validation et suivi des changements pour que l’utilisateur puisse modifier le type librement.

3. **Synchronisation backend / DB**

   * Création et mise à jour des factures incluent maintenant le type.
   * Plus de risque que le formulaire et la base divergent.

4. **PDF aligné avec le type de facture**

   * Si la facture est un acompte, le PDF affiche **“Facture d’acompte”**.
   * L’information est cohérente **du formulaire à l’impression finale**.

## Ce que ça apporte 💡

* Chaque facture a un type explicite, clair pour le client et pour l’administration.
* Frontend, backend et PDF sont **alignés et cohérents**.
* La base est prête pour la suite : gestion du solde d’acompte et calcul automatique des paiements.

## Constat 🔍

Aujourd’hui, j’ai posé les **fondations de la facture d’acompte** :

* Formulaire fonctionnel
* Base de données alignée
* PDF à jour

Tout est prêt pour **la prochaine étape**, gérer le solde et automatiser les flux d’acompte.

## Conclusion 🎯

Cette évolution est **une suite logique** de mon application de facturation : on passe d’une **facture unique et simple** à un **système de factures typées**, capable de gérer tous les scénarios de paiement. 😎
