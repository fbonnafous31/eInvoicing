# Roadmap eInvoicing – MVP+ Détaillée 

## Objectif
Fournir une application de facturation électronique fonctionnelle, conforme, souveraine et simple, prête à l'utilisation pour petites structures et freelances, avec un périmètre clair et limité.
Cette version détaillée de la roadmap permet de savoir précisément **sur quoi travailler** pour chaque item.

---

## 1️⃣ Priorité Haute – Indispensable pour production (🔴)

### Export / Réversibilité
- **Tâches :**
  - Vérifier que toutes les entités (clients, factures, PDF, XML) peuvent être exportées
  - Créer un script d’export automatique / manuel
  - Documenter procédure de backup PostgreSQL
  - Tester restauration complète en local
- **Objectif :** garantir la souveraineté et la sécurité des données

### Parcours vendeur verrouillé
- **Tâches :**
  - Vérifier que l’utilisateur ne peut pas accéder à l’app sans fiche vendeur complète
  - S’assurer que la création de plusieurs vendeurs est impossible
  - Tester toutes les routes sensibles côté backend
- **Objectif :** éviter toute erreur ou usage non conforme

### Tests E2E critiques
- **Tâches :**
  - Identifier les parcours clés : création facture, envoi email, export, validation vendeur
  - Écrire les tests E2E Vitest / Playwright si nécessaire
  - Valider la couverture et corriger les éventuelles failles
- **Objectif :** sécuriser les parcours utilisateurs majeurs

### Sécurité / garde-fous
- **Tâches :**
  - Vérifier que tous les garde-fous métier restent actifs après refactorings
  - S’assurer que les erreurs critiques sont correctement remontées
- **Objectif :** maintenir la robustesse produit

---

## 2️⃣ Priorité Moyenne – Usage & perception (🟡)

### Gestion adresses client
- **Tâches :**
  - Ajouter champ adresse de facturation (obligatoire)
  - Ajouter champ adresse de livraison (optionnelle)
  - Permettre de définir une adresse par défaut
  - Afficher adresse sélectionnée lors de la création d’une facture
  - Vérifier compatibilité PDF/A-3 et Factur-X
- **Objectif :** offrir un usage réaliste sans complexité

### Objet email par défaut
- **Tâches :**
  - Définir objet par défaut par vendeur : `Facture {{numero_facture}} – {{nom_vendeur}}`
  - Ajouter option de personnalisation simple à l’envoi
  - Tester envoi email avec différentes variables
- **Objectif :** améliorer la perception professionnelle

### Projection utilisateur vitrine
- **Tâches :**
  - Ajouter section scénarios utilisateurs : Freelance, Petite structure, Tech indépendant
  - Inclure mini simulateur de facturation ou flux simplifié (optionnel)
  - Vérifier clarté et lisibilité
- **Objectif :** aider l’utilisateur à se projeter avant test

---

## 3️⃣ Priorité Basse – Nice-to-have (🟢)

### Conformité accompagnée
- **Tâches :**
  - Identifier cas statuts légaux : micro, SAS, TVA
  - Ajouter info contextuelle (tooltip / popup) selon statut
- **Objectif :** faciliter compréhension sans impacter le MVP

### Templates / paramétrage avancé email
- **Tâches :**
  - Ajouter possibilité de personnalisation avancée (optionnelle)
  - Définir variables disponibles, garder simplicité
- **Objectif :** satisfaire demandes futures sans complexité

---

## Séquence conseillée (avec détails)
1️⃣ Sécurité / Parcours vendeur / Réversibilité → tester tout parcours critique

2️⃣ Tests E2E critiques → écrire et exécuter tests sur staging

3️⃣ Gestion adresses client → ajouter champs + sélectionner à la facture + tester PDF

4️⃣ Objet email par défaut → définir objet + personnalisation simple + tester envoi

5️⃣ Projection utilisateur sur vitrine → scénarios + mini simulateur

6️⃣ Backlog Conformité accompagnée → créer info contextuelle pour statuts

7️⃣ Backlog Templates email avancés → planifier pour futur besoin

---

## Règles générales
- Tout hors liste = hors scope
- Simplicité et utilité réelles
- Industrialisation déjà en place (CI/CD, Docker, Monitoring)
- Communiquer souveraineté et garde-fous sur vitrine & docs
- Chaque item détaillé = tâches concrètes à cocher lors du développement

---
