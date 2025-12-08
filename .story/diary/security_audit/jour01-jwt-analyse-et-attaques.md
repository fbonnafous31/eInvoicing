# Audit technique de sécurité - eInvoicing

**Date :** 8 décembre 2025
**Objet :** Analyse de la sécurité front/back et des mécanismes JWT dans l'application eInvoicing

---

## 1. Contexte

L'objectif de cet audit est d'évaluer la sécurisation des données multi-tenant dans eInvoicing, en particulier la séparation des accès entre sellers et la robustesse de l'utilisation des tokens JWT pour l'authentification et l'autorisation.

## 2. Analyse des mécanismes actuels

### 2.1 Authentification et JWT

* Chaque utilisateur dispose d'un JWT qui contient les claims principaux : `sub`, `iss`, `aud`, `scope`.
* Les endpoints critiques du backend **vérifient `req.seller.id`** pour s'assurer que les requêtes n'accèdent qu'aux données du seller correspondant.
* Les tokens sont utilisés pour authentifier et autoriser toutes les opérations sensibles (création, lecture, modification, suppression de clients et factures).

**Points observés :**

* La validation basique fonctionne et empêche l'accès aux données d'autres sellers.
* Les tokens ne sont pas encore soumis à une rotation régulière ni à un mécanisme de révocation.
* Les claims JWT pourraient être rendues plus strictes (par exemple, `iss` et `aud`).

### 2.2 Contrôles côté backend

* Les services et modèles vérifient `seller_id` pour chaque opération critique.
* Les endpoints clients et factures refusent la manipulation de `seller_id` arbitraire.
* Logging complet côté serveur avec seller_id, client_id et détails de la requête.

**Points d’amélioration :**

* Vérification `seller_id` côté service pour double-check.
* Masquage des données sensibles dans les logs.
* Rate limiting pour prévenir l’extraction massive de données si token compromis.

### 2.3 Contrôles côté frontend

* Les appels API passent via JWT, ce qui est correct.
* Analyse des requêtes réseau (F12) montre que les données sont correctement filtrées côté backend.
* Les endpoints publics (PDF / Factur-X) exposent encore des URLs statiques susceptibles d’être accessibles si le lien est partagé.

**Points d’amélioration :**

* Sécurisation des URLs publiques avec token signé ou expiration.
* Éviter l’exposition de données sensibles dans le payload JSON visible côté client.

## 3. Évaluation des risques

| Risque                   | Gravité | Probabilité | Commentaire                                                                                |
| ------------------------ | ------- | ----------- | ------------------------------------------------------------------------------------------ |
| Vol de JWT               | Élevée  | Moyenne     | Un token volé permet d’accéder aux données du seller associé.                              |
| Claims JWT insuffisantes | Moyenne | Moyenne     | Un client pourrait utiliser le token sur un autre endpoint si `aud` ou `iss` non vérifiés. |
| Exposition PDF/Fichiers  | Moyenne | Faible      | Lien public pourrait être partagé, donnant accès à des documents sensibles.                |
| Logging excessif         | Faible  | Moyenne     | Les logs peuvent contenir des données sensibles (emails, SIRET).                           |

## 4. Recommandations techniques

1. **JWT et authentification**

   * Implémenter rotation régulière des clés JWT.
   * Ajouter un mécanisme de révocation de tokens compromis.
   * Restreindre strictement les claims : `iss`, `aud`, `scope`.
   * Réduire la durée de vie des tokens et utiliser des refresh tokens sécurisés.

2. **Backend**

   * Vérifier systématiquement `seller_id` à tous les niveaux (controllers et services).
   * Masquer les données sensibles dans les logs.
   * Implémenter rate limiting pour prévenir les accès massifs.
   * Sécuriser endpoints exposant fichiers PDF / Factur-X avec signature ou expiration des URLs.

3. **Frontend / Réseau**

   * S’assurer que toutes les requêtes passent via HTTPS.
   * Minimiser les informations sensibles visibles dans les payloads.
   * Surveiller les requêtes réseau pour identifier les anomalies.

## 5. Conclusion

La sécurité multi-tenant côté front/back de eInvoicing est **globalement solide**, avec les contrôles essentiels déjà en place. Les vulnérabilités restantes concernent surtout **la gestion des JWT, l’exposition de certains fichiers et la robustesse des claims**.

Les recommandations proposées sont réalistes et permettent de renforcer la sécurité sans impact majeur sur l’expérience utilisateur.

✅ Prochaine étape : mise en œuvre progressive des recommandations, suivi des logs et tests d’intrusion ciblés sur JWT et endpoints critiques.
