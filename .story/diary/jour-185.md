# Jour #185 - Consolider les fondations avant la facture de solde 🧱

## Prendre le temps d'ajuster 🤔

Après avoir posé les bases de la **facture d'acompte** hier, la
prochaine étape logique serait de gérer la **facture de solde**.

Mais avant d'aller plus loin, j'ai pris un peu de temps pour **corriger
et améliorer certains points techniques** qui me gênaient.

Quand on construit un produit, on a souvent envie d'enchaîner les
fonctionnalités.\
Pourtant, ces moments où l'on **ralentit pour consolider** sont
essentiels pour garder une base saine.

C'est exactement ce que j'ai fait aujourd'hui.

------------------------------------------------------------------------

## Corrections autour du Factur-X 📄

En testant mes factures avec l'outil de validation de la FNFE-MPE (Forum
National de la Facture Électronique et des Marchés Publics), je me suis
aperçu que certaines **balises du schéma Factur-X** n'étaient pas
parfaitement conformes.

Ce qui est intéressant, c'est que ces erreurs **n'étaient pas apparues
dans mes tests précédents**.

J'ai donc corrigé les éléments concernés pour que mes factures passent
**la validation officielle**.

C'est un bon rappel : dans la facturation électronique, **la conformité
ne se joue parfois que sur quelques balises XML**.

------------------------------------------------------------------------

## Une CI plus robuste 🔧

Je me suis aussi aperçu que ma **CI échouait à cause de tests de
vulnérabilités npm**.

Certaines dépendances déclenchaient un niveau d'alerte élevé, notamment
autour du module `file-type`, alors que le problème venait surtout d'une
**question de compatibilité entre modules CommonJS et ESM**.

J'ai donc revu mon pipeline pour :

-   appliquer les correctifs sûrs via `npm audit`
-   adapter mon script d'analyse
-   ne faire échouer la CI **que pour les vulnérabilités réellement
    critiques**

Résultat : un pipeline **plus fiable et plus pertinent**.

------------------------------------------------------------------------

## Régénérer le PDF après modification 🔄

Autre amélioration importante : la **régénération du PDF**.

Imaginons le cas simple :

Un utilisateur crée une facture et saisit **100 € au lieu de 200 €**.

Il corrige ensuite les données dans le formulaire...\
mais le PDF généré précédemment reste faux.

J'ai donc ajouté la possibilité de **régénérer le PDF à partir des
données mises à jour**.

Cette action reste évidemment possible **tant que la facture n'a pas été
transmise à la plateforme de facturation**.\
Une fois envoyée, elle devient immuable.

------------------------------------------------------------------------

## Une liste de factures plus claire 👀

J'ai aussi ajusté l'interface de la liste de factures.

J'ai retiré les colonnes **commande** et **contrat** de la liste.

Ces informations restent bien présentes dans la facture elle-même et
dans le PDF, mais elles n'apportaient pas beaucoup de valeur dans la vue
principale.

Mon application vise surtout des **indépendants et petits
entrepreneurs**, qui n'ont pas forcément de commande ou de contrat
formel pour chaque facture.

Résultat : une liste **plus lisible et moins remplie de colonnes
vides**.

------------------------------------------------------------------------

## Identifier le type de facture d'un coup d'œil 🏷️

Dernière amélioration : l'ajout d'un **tag visuel pour le type de
facture** dans la liste.

Chaque facture affiche maintenant un label :

-   Facture
-   Acompte
-   Solde

Avec une couleur et une taille uniforme pour les repérer immédiatement.

C'est un petit détail d'interface, mais il permet de **comprendre
instantanément la nature du document**.

------------------------------------------------------------------------

## Conclusion 🎯

Aujourd'hui n'était pas une journée de grandes fonctionnalités.

C'était plutôt une journée de **stabilisation et d'amélioration** :

-   conformité Factur-X validée
-   CI plus fiable
-   PDF régénérable
-   interface simplifiée
-   meilleure lisibilité des factures

Autant de petites évolutions qui rendent l'application **plus solide et
plus agréable à utiliser**.

Et maintenant que ces fondations sont propres, je peux revenir à la
prochaine étape :\
**la gestion complète du solde d'acompte**. 🚀