# Jour 102 – PDP Mock & préparation des adapters 🚀🔌

📝 Aujourd’hui, l’objectif était de **stabiliser le workflow PDP** en mock et de préparer l’architecture pour intégrer de vrais adapters. L’idée est de pouvoir **développer et tester le front et le backend** sans dépendre d’un PDP réel, tout en gardant la flexibilité pour ajouter des providers futurs comme iOpole.

📦 Le mock PDP est maintenant pleinement opérationnel :

* Création automatique de `submissionId` pour chaque facture envoyée.
* Statuts techniques aléatoires (`validated` / `rejected`) pour simuler le passage complet dans le PDP.
* Lifecycle métier complet avec codes de statut, labels et commentaires pour tester le suivi métier dans le front.
  Cela permet de **tester toutes les interactions front** et les différents cas de figure sans dépendance externe.

🛠️ Côté backend, j’ai centralisé la logique PDP dans un **service unique (`PDPService`)**, qui gère à la fois le mock et les adapters réels.

* Si `provider === 'mock'`, on simule le statut `validated` immédiatement en base et on suit le lifecycle métier.
* Si `provider` est réel (iOpole ou futur fournisseur), le service pourra **envoyer la facture, récupérer le `submissionId` et suivre le statut via l’API**.

⏱️ Le polling front a été corrigé pour **stopper correctement la boucle** dès que le statut technique est `validated` ou `rejected`. La normalisation (`toLowerCase`) a permis de résoudre le bug récurrent où le front continuait à interroger la DB même avec un statut final.

📬 Pour les futurs adapters, l’API iOpole ([iOpole Invoice API](https://api.iopole.com/v1/api/#/Invoice/post_v1_invoice)) est à l’étude. Elle permet d’envoyer les factures, récupérer les statuts et suivre le cycle complet de traitement. L’objectif est de **remplacer progressivement le mock** par un adapter réel en gardant le backend agnostique vis-à-vis du provider.

💡 La réflexion clé du jour : en séparant mock et adapter réel, on garde un **environnement de développement stable**, testable et sécurisé, tout en préparant une **extensibilité future**. Cela permet d’avancer sur le frontend et le backend sans blocage et d’avoir une base solide pour l’intégration des PDP réels.

🚀 Prochaines étapes :

1. Développer un adapter réel iOpole dans `PDPService`.
2. Automatiser la mise à jour des statuts techniques et métiers côté backend.
3. Éventuellement simplifier le backend en intégrant `PDPService` directement plutôt qu’en module séparé.
4. Tester tous les scénarios métier avec le mock avant de passer au réel.
