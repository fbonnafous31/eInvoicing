# Audit technique de sécurité — eInvoicing

**Date :** 9 décembre 2025  
**Objet :** Analyse de la sécurité front/back et des mécanismes JWT dans l'application eInvoicing  

---

# 1. Contexte

L'objectif de cet audit est de sécuriser les données multi-tenant dans eInvoicing, en particulier :

* La séparation des accès entre sellers.
* La robustesse des JWT pour l'authentification et l'autorisation.
* La stabilité du backend face à des requêtes volumineuses.

Aujourd'hui, l'audit a été structuré en **4 phases de tests (A → D)**.

---

# 2. Phases de tests

## Phase A — Validation JSON & Tokens

**Objectif :** vérifier le parsing JSON, la validation des champs et l’intégrité des tokens.

| Test                | Objectif                                                       | Résultat observé                           |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| Body vide            | Vérifier que la route valide le corps avant l’authentification | ✔️ Erreur propre (`body validation error`) |
| Body incorrect       | Tester la validation des champs obligatoires                   | ✔️ Erreur propre                           |
| JSON invalide        | Vérifier le parsing JSON                                       | ✔️ Erreur propre (`Unexpected token`)      |
| Token corrompu       | Tester l’intégrité cryptographique                             | ✔️ `invalid token`                         |
| Payload modifié      | Vérifier protection de la signature                            | ✔️ `invalid signature`                     |
| Token absent         | Vérifier protection d'accès                                    | ✔️ `No authorization token was found`      |

**Conclusion Phase A :**

* Validation correcte du JSON et des payloads.  
* Gestion propre des erreurs.  
* Contrôle strict de l’intégrité des tokens.  
* Aucune route accessible sans token.

---

## Phase B — Falsifications JWT

**Objectif :** tester la résistance du backend face à la falsification de JWT.

| Test                                     | Objectif                                                   | Résultat observé       |
| ---------------------------------------- | ---------------------------------------------------------- | ---------------------- |
| Signature modifiée                        | Détecter une falsification du token                         | ✔️ `invalid signature` |
| Payload falsifié (`sub`)                  | Tester usurpation d’utilisateur                             | ✔️ `invalid signature` |
| Payload falsifié (`aud`)                  | Vérifier que le token cible bien l’API                      | ✔️ `invalid signature` |
| Payload falsifié (`iss`)                  | Vérifier l’origine Auth0                                     | ✔️ `invalid signature` |
| Token expiré (`exp`)                      | Rejet automatique des jetons périmés                        | ✔️ `JWT expired`       |
| Header manipulé / alg changé              | Protection contre attaques type “alg=none”                  | ✔️ `invalid signature` |
| Token formaté correctement mais faux     | Vérification RS256 + JWKS                                    | ✔️ `invalid signature` |

**Conclusion Phase B :**

* Aucun token falsifié n’est accepté.  
* Signature inviolable grâce au JWKS Auth0.  
* Rejet immédiat des tokens expirés.  
* Protection contre downgrade HS256/RS256.  

✅ Phase B validée.

---

## Phase C — Cohérence User ↔ Vendor & Accès Ressources

**Objectif :** s’assurer que chaque user ne peut accéder qu’à ses données et que l’architecture single-vendor est respectée.

| Test                                | Objectif                                                            | Résultat observé |
| ----------------------------------- | ------------------------------------------------------------------- | ---------------- |
| Facture inexistante                 | Retour 404 générique, pas d’information sur d’autres users/factures | ✔️ OK            |
| Client inexistant                   | Retour 404 générique                                                | ✔️ OK            |
| Ressource supprimée                 | Retour 404 générique                                                | ✔️ OK            |
| User sans vendor                    | Redirection vers création du vendor                                 | ✔️ OK            |
| User avec vendor                    | Accès normal                                                        | ✔️ OK            |
| Tentative d’attaquer vendor externe | 403 ou 404                                                          | ✔️ OK            |
| Tentative création 2e vendor        | Refus systématique                                                  | ✔️ OK            |

**Conclusion Phase C :**

* Cohérence User ↔ Vendor respectée.  
* Aucune fuite d’information détectée.  
* Routes admin non présentes → test validé par défaut.  

**Correctif clé :** isolation stricte des factures et clients via `seller_id`.

---

## Phase D — Body très long

**Objectif :** tester la robustesse face à des payloads volumineux et la stabilité du serveur.

| Test                      | Description                                   | Résultat observé                         |
| ------------------------- | --------------------------------------------- | ---------------------------------------- |
| Payload 20 000 caractères | POST /api/clients avec champ `name` très long | ✔️ Serveur répond rapidement             |
| Payload > 10 kb           | JSON > 10 kb                                  | ✔️ Erreur 413 `request entity too large` |
| Payload < 10 kb           | JSON < 10 kb                                  | ✔️ Accepté et traité normalement         |
| Absence de crash          | Même avec payload énorme                      | ✔️ Serveur stable, aucune fuite mémoire  |

**Conclusion Phase D :**

* Limite des requêtes correctement appliquée (`express.json({ limit: '10kb' })`).  
* Rejet des payloads trop lourds avant logique métier.  
* Serveur stable et réactif.  

**Correctif clé :** limitation de la taille des requêtes pour protéger le backend.

---

# 3. Recommandations générales

1. Rotation + refresh tokens pour renforcer la sécurité JWT.  
2. Rate limiting sur endpoints sensibles.  
3. Logging structuré des erreurs JWT et payloads excessifs.  
4. Tests automatisés CI/CD : payloads extrêmes, falsifications JWT.  
5. Documenter les limites des payloads côté API (10 kb par défaut).  
6. Masquage des données sensibles dans les logs et sécurisation des URLs publiques (PDF / Factur-X).  

---

# 4. Résumé final

L’application eInvoicing est **robuste, sécurisée et conforme aux bonnes pratiques** :

* Phases A → D validées ✅  
* JWT inviolable et résistant aux falsifications  
* Cohérence business User ↔ Vendor assurée  
* Protection contre les payloads excessifs  
* Serveur stable et réactif  

✅ Audit complet prêt pour **production**.
