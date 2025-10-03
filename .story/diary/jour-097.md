# Jour 97 – Staging remote et simplification du workflow PDF / PDP 🌐📄

Aujourd’hui, la session a été centrée sur **la stabilisation de l’environnement staging en remote**, avec une volonté de **restreindre certaines fonctionnalités** pour rester en conformité avec la réglementation. Cela a conduit à des adaptations côté frontend et backend, notamment autour de l’affichage des PDF et de la génération des factures.

## 🔹 Objectif du jour

* Simplifier le workflow de facturation en staging pour éviter les risques réglementaires.
* Revoir l’affichage et la génération des **PDF et PDF/A-3** dans le frontend.
* Supprimer le mock PDP et injecter directement les statuts dans la base de données.

## 🔹 Avancement

### 1️⃣ Adaptation des boutons et interactions ✅

* Les boutons “Envoyer”, “Rafraîchir” et “Encaisser” ont été désactivés via des **icônes avec tooltip**, pour que l’utilisateur voie les actions possibles mais ne puisse pas cliquer.
* Les icônes sont affichées **naturelles**, sans styles de boutons ou grisaille.
* L’alignement et l’espacement des icônes ont été harmonisés avec les autres actions de la table.

### 2️⃣ PDF / PDF/A-3 ✅

* Vérification et correction de l’affichage dans la visionneuse PDF.
* Ajustement de la génération de PDF à la création de la facture.
* Tests sur les exports pour garantir que le téléchargement et l’ouverture fonctionnent en staging.

### 3️⃣ Abandon du mock PDP ✅

* L’idée initiale d’un mock PDP a été **abandonnée**.
* À la place, les statuts techniques et métiers des factures sont **injectés directement dans la base de données**.
* Cela simplifie la logique et évite tout appel externe potentiellement risqué ou non conforme.

### 4️⃣ Backend et DB ✅

* Les statuts des factures sont stables et reflètent correctement les valeurs injectées en DB.
* La table `invoices` est alimentée avec une répartition réaliste des `technical_status` et `business_status`.

## 🔹 Réflexion du jour

* Le staging remote est maintenant **fonctionnel et sécurisé**, avec certaines fonctionnalités restreintes.
* Les ajustements côté frontend ont permis d’avoir un affichage clair et cohérent des PDF et des actions disponibles.

## 🔹 Prochaines étapes

1. Obtenir l'ISO 19005 pour les PDF/A3
2. Communiquer sur le projet

---

👉 Jour 97 marque **la stabilisation finale du staging remote**, avec des fonctionnalités sécurisées et un workflow simplifié pour la génération et le suivi des factures. 🚀
