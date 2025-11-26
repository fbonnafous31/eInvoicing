# Jour 157 -- Renforcer les fondations 🔐🧱

Aujourd'hui, j'ai continué à travailler sur un sujet que je prends
vraiment au sérieux depuis les premières briques de l'application : la
sécurité.\
Pas un "truc en plus", pas un patch tardif --- mais un élément central
de la construction de l'app.

Deux points au programme : vérifier mes choix autour de Node, et
renforcer la gestion d'upload côté backend.

## 🔄 Node.js : comprendre les risques pour rester serein

L'app tourne actuellement sur **Node v22.18.0**, installée en août.\
C'est une version récente, stable, moderne... mais comme toujours avec
un runtime, il faut comprendre ce que l'on utilise.

Je ne l'ai jamais vécu comme une contrainte : au contraire, j'aime avoir
une base technique à jour et propre.\
Mais je voulais quand même clarifier les risques théoriques :

-   les patchs de sécurité ignorés → surface d'attaque accrue\
-   les régressions ou breaking changes en cas de montée de version\
-   le comportement plus strict de Node 22 sur certains modules\
-   la nécessité de tester correctement avant de mettre à jour

Ce n'est pas de la paranoïa, juste du bon sens.\
Et ça confirme que j'ai fait un choix sain : partir dès le début sur une
version moderne, sécurisée et suivie.

## 📤 Upload : solidifier une brique essentielle

Deuxième chantier du jour : renforcer ma fonction d'upload.

J'avais déjà une base propre, mais j'ai ajouté aujourd'hui plusieurs
améliorations qui la rendent vraiment solide :

-   nettoyage du nom de fichier (éviter les chemins ou caractères
    suspects),
-   vérification stricte du type MIME,
-   contrôle du contenu réel du fichier PDF (bloque les fichiers
    déguisés),
-   limites claires sur les formats autorisés,
-   messages d'erreurs propres et prévisibles.

Le meilleur dans tout ça :\
**aucune régression, aucune route cassée, et le code reste simple.**

C'est exactement le genre de progrès que j'aime : discret en apparence,
mais structurant pour la suite.

## 💭 Ressenti

Je ne découvre pas la sécurité aujourd'hui, elle fait partie du projet
depuis le début.\
Mais ce que je ressens, c'est une cohérence qui s'installe : chaque
amélioration rend l'ensemble plus robuste, plus fiable, plus sérieux.

Ce n'est pas spectaculaire, mais c'est essentiel.\
Et c'est aussi un domaine où j'ai vraiment plaisir à apprendre --- parce
qu'il y a toujours un petit détail à affiner, une surface à réduire, une
logique à clarifier.

Ce genre de journée me rappelle pourquoi j'aime construire des apps :\
on avance, on consolide, et tout devient un peu plus solide.

## ✅ Bilan du jour

-   Vérification de la base Node.js : **✔️**\
-   Upload renforcé et testé : **✔️**\
-   Sécurité cohérente avec le reste du projet : **✔️**\
-   Une app plus fiable, sans sacrifier la simplicité : **✔️**

Un jour de plus, une fondation de plus --- c'est comme ça que se
construit un projet durable.