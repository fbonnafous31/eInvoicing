# Journal de bord - Jour 1

## Définition du projet

Aujourd'hui marque le début officiel de mon nouveau projet : développer une application web permettant la saisie et la gestion de factures fournisseurs.  
L'objectif à long terme est ambitieux : aller jusqu'à produire des factures électroniques conformes aux formats standards (UBL, Factur-X, etc.), et pourquoi pas, à terme, tendre vers une plateforme PDP (Plateforme de Dématérialisation Partenaire).  
Mais chaque chose en son temps : pour cette première étape, je veux me concentrer sur le plus simple et le plus concret possible — permettre à l'utilisateur de saisir les données essentielles d'une facture dans une interface claire et intuitive.

## Choix techniques

Pour ce projet, j'ai fait le choix de technologies modernes, largement utilisées et bien documentées, afin d'assurer à la fois une courbe d'apprentissage progressive et une bonne évolutivité :
- **Frontend : React avec Vite** → pour créer une interface dynamique, rapide et modulaire.
- **Backend : Node.js avec Express** → pour disposer d'une API REST simple à développer et à maintenir, tout en utilisant le même langage (JavaScript) que pour le frontend.
- **Base de données : PostgreSQL** → robuste et performante, parfaitement adaptée aux données relationnelles des factures.

Ces choix me permettront de démarrer vite, tout en gardant la possibilité de faire évoluer le projet vers des fonctionnalités plus complexes.

## Mise à jour et préparation de l'environnement

Mon environnement de développement est basé sur Ubuntu avec VSCode comme éditeur principal.  
Aujourd'hui, j'ai :
- Mis à jour Node.js vers la dernière version LTS grâce à NVM (Node Version Manager).
- Installé Vite et initialisé le projet frontend.
- Configuré les extensions VSCode nécessaires : ESLint, Prettier, PostgreSQL et REST Client.
- Préparé la structure du projet avec deux dossiers séparés : **frontend** et **backend**.

## Prochaines étapes

Pour les prochains jours :
1. Mettre en place un premier formulaire React pour saisir les données d'une facture (numéro, date, fournisseur, montants).
2. Créer l'API Express pour enregistrer ces données dans PostgreSQL.
3. Afficher la liste des factures saisies.

C’est le début, mais la base est posée. 🚀
