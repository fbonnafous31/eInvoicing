# Programme de la Semaine Sécurité

## 🟦 Jour 1 --- Comprendre et attaquer ton propre Auth / JWT

**Objectif** : comprendre les limites de ton authentification et
manipuler ton JWT.

1.  **Explorer ton JWT**
    -   Décoder sur jwt.io.
    -   Observer claims, expiration, algorithme.
    -   Vérifier signature RS256 ou HS256.
2.  **Attaques "safe" sur JWT**
    -   Modifier le payload et tester.
    -   Retirer ou modifier exp.
    -   Tester changement d'algorithme (HS256 → none).
    -   Tester replay attack.
3.  **Notes techniques**
    -   Documenter ce que ton backend bloque ou ne bloque pas.
    -   Lister améliorations possibles (rotation de clés, claims
        stricts...).

------------------------------------------------------------------------

## 🟧 Jour 2 --- Attaques API & fuzzing

**Objectif** : tester la robustesse de ton API face à des entrées
malveillantes / aléatoires.

1.  **Fuzzing manuel** (Postman / Insomnia)
    -   Body aléatoires, types incorrects, objets vides.
    -   Injection HTML ou JSON mal formé.
2.  **Fuzzing automatisé**
    -   OWASP ZAP Fuzzer ou Schemathesis.
    -   Tester GET / POST / PUT et paramètres d'URL.
3.  **Analyse**
    -   Regarder les logs Pino pour erreurs ou fuites d'information.
    -   Identifier erreurs trop détaillées à corriger.

------------------------------------------------------------------------

## 🟨 Jour 3 --- Multi-tenancy : tentatives d'escalade

**Objectif** : tester la séparation des tenants.

1.  **Manipulation des ID tenants**
    -   Modifier ID dans les requêtes, headers ou payload.
2.  **Attaques indirectes**
    -   Lister ou accéder à des IDs inexistants.
    -   POST malicieux vers un autre tenant.
3.  **Analyse**
    -   Vérifier logs et messages retournés (403 vs 404, détails
        d'erreur).

------------------------------------------------------------------------

## 🟩 Jour 4 --- Attaques injection & fichiers

**Objectif** : tester les failles classiques et l'upload sécurisé.

1.  **Tests d'injection SQL**
    -   ' OR 1=1 --, "; DROP TABLE users; --, etc.
    -   Tester filtres, recherche et body POST.
2.  **Path traversal et uploads**
    -   Chemins relatifs ../../etc/passwd
    -   Faux MIME, fichiers obfusqués, zip bomb
3.  **Test antivirus**
    -   Fichier EICAR pour vérifier la détection.

------------------------------------------------------------------------

## 🟪 Jour 5 --- Hardening & corrections

**Objectif** : renforcer ton application après les tests.

1.  **Hardening JWT**
    -   Imposer RS256, claims stricts (iss, sub, aud), rotation de clés.
    -   Vérifier signature Auth0 côté backend.
2.  **Sécurisation des erreurs**
    -   Uniformiser erreurs API, cacher stack traces côté client.
3.  **Mini check-list sécurité**
    -   Tests multi-tenant réguliers.
    -   Tests uploads.
    -   Tests injection.
    -   Ping JWT.
    -   Scan léger OWASP ZAP.