# Jour 168 - Audit sécurité eInvoicing : JWT, isolation et robustesse 🔒

Aujourd'hui, je me suis concentré sur la **sécurité et l’isolation des données** dans eInvoicing, avec une approche structurée en **4 phases de tests** pour m’assurer que chaque utilisateur ne peut accéder **qu’à ses propres clients et factures**, et que le backend reste robuste face aux requêtes extrêmes.

---

## Phase A — Vérification des payloads et parsing JSON

**Objectif :** s’assurer que le backend gère correctement toutes les entrées JSON, que le corps de la requête est valide et que les erreurs sont explicites.

**Tests effectués :**
* Body vide → rejet propre (`body validation error`)
* Body incorrect → erreur cohérente
* JSON invalide → parsing détecté (`Unexpected token`)
* Absence de token → accès refusé
* Token corrompu → `invalid token`
* Payload modifié → `invalid signature`

**Résultat :**

✔️ Validation correcte des entrées et des tokens  
✔️ Gestion propre des erreurs  
✔️ Aucune route accessible sans JWT

---

## Phase B — Falsification et manipulation des JWT

**Objectif :** vérifier que la signature RS256 ne peut pas être contournée et que le token est inviolable.

**Tests effectués :**
* Signature modifiée → `invalid signature`
* Payload falsifié (`sub`, `aud`, `iss`) → rejet immédiat
* Token expiré → `JWT expired`
* Header manipulé (`alg=none`) → `invalid signature`
* Token formaté correctement mais falsifié → rejet

**Résultat :**

✔️ Aucun token falsifié n’est accepté  
✔️ Protection robuste contre usurpation et downgrade HS256/RS256  
✔️ Rejet immédiat des tokens expirés

---

## Phase C — Contrôle d’accès et cohérence multi-tenant

**Objectif :** s’assurer que chaque utilisateur n’accède **qu’à ses propres données** et que l’architecture single-vendor est respectée.

**Tests effectués :**
* Accès à des factures inexistantes ou supprimées → 404 générique, sans fuite d’information
* Tentative d’accès à d’autres vendor_id → 403 ou 404
* Tentative de création d’un 2e vendor → refus
* Vérification que tout user sans vendor est redirigé vers création

**Résultat :**

✔️ Isolation par `seller_id` respectée  
✔️ JWT vérifié côté services et contrôleurs  
✔️ Aucun risque d’accès à d’autres comptes

---

## Phase D — Résilience face aux corps très longs

**Objectif :** tester la robustesse du backend face aux payloads très volumineux.

**Test effectué :**
* POST avec un champ `name` de 20 000 caractères

**Résultat :**
* Rejet immédiat (`request entity too large`)  
* Le backend ne crash pas et répond très rapidement  
* Limitation implémentée via `express.json({ limit: '10kb' })` et `express.urlencoded({ limit: '10kb', extended: true })`

---

## Observations générales

* La sécurité multi-tenant est **robuste côté controller et modèle**.  
* Les JWT sont **matures et durcis**, aucune falsification ne passe.  
* Le backend gère bien les requêtes volumineuses sans perte de performance.  
* Les logs offrent une bonne traçabilité, même si certaines données sensibles peuvent encore être masquées.

---

## Correctifs clés mis en place

1. **Isolation stricte des factures et clients** via `seller_id`.  
2. **Limitation de la taille des requêtes** (`10kb`) pour prévenir les abus et protéger le serveur.

---

## Prochaines étapes

* Rotation et revocation des JWT  
* Vérification stricte des claims (`iss`, `aud`, `scope`)  
* Masquage des données sensibles dans les logs  
* Rate limiting pour limiter les extractions massives de données  
* Sécurisation des URLs publiques (PDF et Factur-X)  
* Tests automatiques CICD pour s’assurer que chaque seller ne peut jamais accéder aux données des autres

---

✅ Cette journée de tests permet à eInvoicing de progresser vers un backend **plus sûr, auditable et résilient**, tout en consolidant la compréhension pratique des JWT et de l’isolation multi-tenant.
