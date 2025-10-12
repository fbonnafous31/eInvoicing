# Jour 106 – PDP & Statuts métier 🔄💻

Aujourd’hui, j’ai continué à creuser l’intégration avec le PDP et la gestion des statuts métier pour les factures. L’objectif principal : pouvoir afficher correctement les statuts renvoyés par la plateforme et guider l’utilisateur en cas de rejet.

## 🛠 Ce que j’ai fait ce matin

1️⃣ **Mise en place du `fetchStatus` dans l’adapter**

* J’ai ajouté une méthode spécifique pour interroger le PDP et récupérer le statut exact d’une facture.
* Cela nous permet désormais de ne plus dépendre des mocks pour le suivi, et d’avoir une source de vérité cohérente.

2️⃣ **Prise en compte du `schemeId` pour le Factur-X**

* Pour Iopole, le `schemeId` doit être **0009**.
* Cela garantit que les fichiers envoyés sont correctement identifiés par la plateforme et que le PDP sait comment les traiter.

3️⃣ **Gestion des messages PDP côté front**

* Les messages renvoyés par la plateforme sont désormais récupérés et affichés directement à l’utilisateur.
* Exemple : si la plateforme rejette une facture à cause d’un SIREN/SIRET invalide, l’utilisateur voit le message exact :

  ```
  Invoice seller siren and siret are invalid or not exist
  ```

  avec un petit indicatif que ça vient bien du PDP.
* L’avantage : pas besoin de transformer ou de reformuler le message, on garde la transparence et la précision.

## ⚠️ Les difficultés rencontrées

Même si l’API fonctionne correctement, il est **impossible pour l’instant d’obtenir un vrai statut métier** depuis le PDP :

* Nous n’avons pas de vendeur de test actif sur la plateforme.
* Du coup, toutes les factures envoyées retournent un rejet ou restent en attente, même si tout est correct côté code.

C’est frustrant car on ne peut pas tester complètement le cycle métier, mais au moins le mécanisme est en place et fonctionne correctement. Dès qu’un vendeur de test sera disponible, le front pourra afficher les statuts exacts et permettre de suivre les factures jusqu’à leur encaissement.

---

💡 Ce matin était donc une étape **technique mais nécessaire** : adapter l’infrastructure pour que dès qu’on aura un environnement de test complet, tout fonctionne directement. Le front est prêt à afficher les messages, et le backend à récupérer les statuts exacts du PDP.
