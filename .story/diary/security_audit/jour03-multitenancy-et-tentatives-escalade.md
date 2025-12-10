# 🛡️ Audit Technique – API Clients & Factures

**Périmètre :** Logging, Validation, Multitenant, Résilience & Accès Publics  
**Date :** 10 décembre 2025

---

# 🔥 Phase A - Tests d’escalade via manipulation d’IDs 

## 1. Objectif

Vérifier que le backend protège correctement les données multi-tenant en empêchant toute récupération ou modification de ressources appartenant à un autre seller.  
Tests couverts :

- Cohérence des statuts HTTP (403 / 404 selon les cas)  
- Non-divulgation d’informations sensibles dans les réponses  
- Résistance aux IDs malformés ou volontairement extrêmes

## 2. Méthodologie

Routes testées :

- `GET /api/clients/:id`  
- `PUT /api/clients/:id`  
- `DELETE /api/clients/:id`  
- `GET /api/invoices/:id`  
- `PUT /api/invoices/:id`  
- `DELETE /api/invoices/:id`

Types d’IDs utilisés :

1. ID réel appartenant à un autre seller  
2. ID valide mais généré aléatoirement  
3. ID inexistant mais correctement formé  
4. ID malformé ou trop long

## 3. Résultats observés

### ✔️ Isolation multi-tenant correcte

- Un **ID d’un autre seller** → **404 Not Found**  
- Aucune information sur le seller propriétaire ou la présence de la ressource

### ✔️ IDs malformés / trop longs → 400 Bad Request

- IDs invalides → **400 Bad Request** `{ error: "ID client invalide" }`  
- Pas de crash côté PostgreSQL  
- Protection anti-injection efficace

### ✔️ IDs inexistants → 404 générique

- ID valide mais inexistant → **404 Not Found**  
- Aucun détail sur l’existence d’autres tenants

## 4. Logs backend

- `requestLogger` génère un **requestId unique**  
- Logs contiennent : `method`, `url`, `statusCode`, `user.seller_id`  
- Pas de mélange de tenants  
- Erreurs invalides clairement identifiées, sans stacktrace sensible

## 5. Conclusion Phase A

- Isolation multi-tenant robuste  
- Gestion cohérente des statuts HTTP  
- Validation d’ID solide  
- Aucun crash serveur (0 erreur 500)  
- Logs propres et sans fuite

---

# 🔥 Phase B - Validation et gestion des entrées

## 1. Problème détecté

- IDs client trop longs → **500 integer out of range** PostgreSQL

## 2. Correction appliquée

- Validation stricte via regex `/^\d+$/`  
- IDs invalides → **400 Bad Request**

## 3. Gestion uniforme des erreurs

| Cas                                | Code | Comportement                    |
| ---------------------------------- | ---- | -------------------------------- |
| Seller absent                      | 403  | Seller non identifié            |
| Client inexistant / autre seller   | 404  | Client non trouvé               |
| ID invalide                        | 400  | Validation                      |
| Erreur interne                     | 500  | Unexpected                      |

## 4. Vérification Multitenant (clients + factures)

- `attachments_meta` d’un autre seller → **404**  
- JSON mal formé → **400**  
- Plusieurs attachments principaux → **400**

## 5. Création facture (`POST /api/invoices`)

- Client valide → 201  
- Client d’un autre seller → 404  
- Attachment autre seller → 404  
- JSON invalide → 400

## 6. Routes testées

- `GET /api/invoices` → OK, uniquement données du seller  
- `GET /api/invoices/:id` → 200 / 403 / 404 / 400 selon cas  
- `POST /api/invoices` → validé

## 7. Bénéfices Phase B

- Plus de crash serveur  
- Validation homogène  
- Isolation multitenant respectée  
- Traçabilité renforcée

---

# 🔥 Phase C - Edge cases & attaques annexes 

## 1. Requêtes concurrentes rapides (mini-DOS)

### Objectif

- Vérifier isolation tenant  
- Vérifier logs cohérents

### Résultats

- Pas de mélange de tenants  
- Logs propres  
- Pas d’erreurs `UnhandledPromiseRejection`  
- Pas de surcharge CPU/mémoire

## 2. Tests routes publiques (PDF / Factur‑X)

### Résultats

- Tous les fichiers → **404 Not Found**  
- Jamais de 200  
- Pas de fuite documentaire → OK RGPD

---

# 🧾 Conclusion générale

- Backend **sécurisé, robuste et multitenant**  
- Phases A → C validées avec succès  
- Isolation multi-tenant et validation d’ID solides  
- Traçabilité complète grâce au `requestLogger`  
- Routes publiques protégées et conformes RGPD
