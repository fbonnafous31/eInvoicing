# Jour 73 – Premiers pas vers une stratégie de tests 🧪🚀

Aujourd’hui, j’ai commencé à réfléchir sérieusement à la mise en place d’une stratégie de tests pour **eInvoicing**.  
L’objectif n’est plus de vérifier un bug ponctuel, mais de préparer le projet à être robuste et maintenable sur le long terme.

## Pourquoi les tests maintenant ⚙️

Le backend commence à avoir plusieurs modules (factures, clients, PDF, statuts).  
Chaque fonctionnalité génère des données critiques pour les utilisateurs.  
Pour éviter les régressions et sécuriser les évolutions futures, il faut vérifier automatiquement que tout continue de fonctionner à chaque modification.

## Principes de la stratégie que je mets en place 📝

**Tests unitaires 🧩**  
Vérifier la logique métier des controllers et services indépendamment des routes ou de la DB.  
Exemple : calcul du montant total facturé, génération de statuts ou transformation de données.  
✅ On a déjà commencé à initier les tests unitaires côté backend, notamment pour la validation de **SIRET** et certaines **routes invoices**.

**Tests d’intégration 🔗**  
Vérifier que les routes REST fonctionnent correctement et retournent les bonnes réponses JSON.  
Assurer que les middlewares, même si mockés temporairement, s’intègrent correctement avec les routes.  
Pour ces tests, on peut utiliser des outils comme **Vitest** ou **Jest**, qui permettent de lancer facilement des tests unitaires et d’intégration et de s’assurer que tout le backend répond comme prévu.

**Tests end-to-end (E2E) 🏁**  
Simuler le parcours complet d’un utilisateur (connexion, création de facture, génération PDF).  
Prévoir ces tests pour les étapes critiques avant le déploiement.

**Tests automatiques en CI/CD 🤖**  
Chaque push déclenche les tests pour s’assurer qu’aucune modification ne casse l’existant.  
Les tests deviennent un outil de confiance pour continuer à faire évoluer le produit rapidement.

## Avantages attendus 🌟

- Détection rapide des bugs avant qu’ils n’affectent les utilisateurs.  
- Documentation vivante du comportement attendu des modules.  
- Facilitation de la maintenance et de l’évolution : on peut refactorer ou ajouter des fonctionnalités sans peur de casser le core du projet.  
- Meilleure visibilité sur la couverture fonctionnelle : on sait quelles parties sont testées et quelles parties restent à sécuriser.

## 📌 Prochaines étapes

- Prioriser les routes et services les plus critiques pour commencer les tests.  
- Définir un pattern standard pour les tests unitaires et d’intégration afin que le code reste lisible et maintenable.  
- Intégrer progressivement **Vitest + Supertest** pour couvrir l’ensemble des modules backend, avec éventuellement **Jest** comme alternative ou complément selon les besoins.  
- À moyen terme, ajouter des tests E2E sur des scénarios clés, notamment la génération et l’envoi des factures.  
