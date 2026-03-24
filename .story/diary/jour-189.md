# Jour #189 - Annulation des factures : conformité et audit 📌

Aujourd’hui, je fais un petit **retour sur tout ce que j’ai mis en place** pour sécuriser la gestion des annulations de factures.

---

## Un trou dans la raquette 🕳️

Je me suis rendu compte qu’il pouvait y avoir un **risque de trou dans la numérotation** si une facture était supprimée physiquement.
Dans mon produit, l’utilisateur **n’a jamais accès à la numérotation**, donc à l’exception de bugs, ce risque était limité.
Pour être sûr d’être **totalement conforme**, j’ai décidé de **ne plus permettre de suppression physique**.

> Résultat : toute facture supprimée passe désormais en **statut “annulé”**, ce qui préserve l’intégrité de la numérotation et de l’historique.

---

## Motiver l’annulation ✍️

Je voulais aussi que l’utilisateur **puisse motiver l’annulation**.
J’ai donc ajouté :

* un champ **`cancel_reason`** pour stocker le motif
* un champ **`cancelled_at`** pour tracer la date de l’annulation
* des **logs Pino** pour suivre chaque étape : du controller au service jusqu’au modèle

Comme ça, **chaque annulation est documentée**, exploitable pour les audits ou le support.

---

## Conformité réglementaire 📚

Tout ce travail s’appuie sur les textes officiels :

* **CGI – article 242 nonies A, annexe II** : obligation de numérotation continue des factures
* **Code de commerce – article L123-22** : conservation des documents comptables
* **NF 203 (Logiciel de Comptabilité)** : le logiciel **ne doit pas permettre de modifier ou supprimer une écriture validée**

Concrètement, dans mon produit :

* aucune facture validée n’est supprimable
* toutes les annulations sont **traçables et auditables**
* la numérotation reste **intègre et continue**

---

## Conclusion 🎯

Fonctionnellement, voilà ce que j’ai fait :

* suppression physique désactivée → statut “annulé”
* possibilité pour l’utilisateur de **motiver l’annulation**
* audit complet avec date et motif
* conformité avec CGI, Code de commerce et NF 203

C’est un **pas de plus vers un logiciel sûr et conforme**, tout en gardant l’expérience utilisateur simple et fluide. 🚀
