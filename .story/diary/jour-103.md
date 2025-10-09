# Jour 103 – Du mock côté serveur à l’adapter 🛠️✨

Aujourd’hui, on a fait un vrai ménage dans la manière dont notre mock de PDP est géré.
Avant, toute la logique « métier » du mock vivait côté serveur, directement dans les routes et services. C’était pratique au début, mais ça mélangeait tout : le code métier, la simulation, la DB et l’API PDP.

🚀 **Ce qu’on a changé :**

* On a déplacé **toute la logique de simulation** dans un **adapter dédié** (`PDPAdapter`).
* L’adapter est maintenant responsable de gérer les statuts techniques et métier, de façon isolée, **sans toucher au reste du serveur**.
* Le serveur devient plus léger : il se contente d’appeler l’adapter et de persister les informations pertinentes dans la DB.

💡 **Pourquoi c’est mieux :**

* La séparation des responsabilités est **claire** : le serveur gère l’API et la persistance, l’adapter gère le mock et la simulation.
* On peut **tester l’adapter indépendamment** du reste de l’application.
* Cela ouvre la voie à remplacer facilement le mock par un vrai provider PDP, sans toucher au serveur.
* La logique métier est **plus prévisible** et moins sujette aux effets de bord.

🎯 **Prochaines étapes :**

* Ajouter des tests ciblés sur l’adapter pour s’assurer que les statuts évoluent correctement.
* Continuer à renforcer la séparation serveur / simulation pour garder un code propre et maintenable.
