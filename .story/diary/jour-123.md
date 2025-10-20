# Jour 123 – Différenciation des offres : Essentiel vs Pro 💡💼

L’objectif du jour : **clarifier les offres Essentiel et Pro** pour les utilisateurs et automatiser la gestion des fonctionnalités spécifiques à chaque plan dans l’application.

---

## 🛠️ Réflexion sur les offres

J’ai pris le temps de **lister les fonctionnalités critiques** pour chaque plan et de réfléchir à leur impact sur l’expérience utilisateur :

| Plan          | Fonctionnalités clés                                                             | Objectif utilisateur                                   |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Essentiel** | Gestion basique des factures, PDF/A-3, téléchargement de PDF                     | Pour les indépendants ou petites structures            |
| **Pro**       | Envoi automatique au PDP, rafraîchissement du cycle métier, encaissement intégré | Pour les PME souhaitant un suivi complet et automatisé |

> Le challenge : **ne pas surcharger Essentiel** tout en donnant aux utilisateurs Pro un vrai avantage métier.

---

## 🖥️ Implémentation sur la vitrine

* Ajout d’une section **comparative claire des plans** :

  * Les fonctionnalités Pro sont affichées avec des **icônes et badges “Pro”**.
  * Essentiel montre uniquement ce qui est disponible, évitant toute confusion.
* CTA adaptés : chaque plan propose un **bouton d’inscription distinct**, avec lien vers la création de compte ou l’upgrade.
* Utilisation d’**un tableau dynamique** pour que les modifications de fonctionnalités futures soient facilement visibles sur la vitrine.

> L’objectif est que le visiteur **comprenne instantanément ce qu’il obtient selon le plan choisi**.

---

## ⚙️ Automatisation dans l’application principale

Pour ne pas gérer le plan manuellement dans chaque composant :

1. **Backend / DB**

   * Le plan du vendeur est stocké dans la table `sellers` (`plan: "essentiel" | "pro"`).
   * Toutes les routes sensibles consultent le plan pour **filtrer ou activer les fonctionnalités**.

2. **Frontend / React**

   * Création d’un hook `useSellerService` pour récupérer le plan du vendeur connecté.
   * Les colonnes et boutons du tableau de factures sont **automatiquement filtrés** selon le plan :

     * Colonnes `"Envoyer / Statut"`, `"Statut facture"` et `"Statut PDP"` masquées si le plan est Essentiel.
     * Les actions spécifiques (envoi PDP, encaissement, rafraîchissement) ne sont visibles que pour Pro.
   * Utilisation de `useMemo` et `useEffect` pour que les composants **réagissent dynamiquement** au plan du vendeur.

3. **Sécurité métier**

   * Même si un utilisateur Essentiel tente de manipuler l’URL ou le front, le backend **bloque l’accès aux fonctionnalités Pro**.
   * Ainsi, l’automatisation est complète et cohérente entre DB, backend et frontend.

---

## 🎯 Bilan du jour

| Élément                     | Avancée                                        | Impact utilisateur                                   |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Vitrine / plan comparatif   | ✅ Section claire Essentiel vs Pro              | Compréhension immédiate des avantages de chaque plan |
| Backend / DB                | ✅ Stockage et récupération automatique du plan | Contrôle centralisé des fonctionnalités              |
| Frontend / tableau factures | ✅ Colonnes et actions filtrées dynamiquement   | UX simplifiée, pas de boutons inutiles               |
| Sécurité                    | ✅ Vérification côté serveur                    | Garantie qu’un plan ne dépasse pas ses droits        |

---

## 🚀 Conclusion

Jour 123 permet de **structurer l’offre commerciale tout en automatisant son impact dans l’application** :

* La vitrine devient **un outil de communication clair**.
* L’application principale **s’adapte automatiquement au plan** du vendeur.
* Les utilisateurs voient uniquement **ce qu’ils peuvent réellement utiliser**, simplifiant l’expérience et réduisant les erreurs.

> **Clarté, cohérence et automatisation** : les trois piliers pour des offres évolutives et sûres 🌿
