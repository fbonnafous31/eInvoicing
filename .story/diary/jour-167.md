# Jour 167 – Audit sécurité eInvoicing : JWT et isolation 🔒

Cette semaine, je me concentre sur la **sécurité et l’isolation des données** dans eInvoicing. L’objectif est de m’assurer que chaque utilisateur ne peut accéder **qu’à ses propres clients et factures**, tout en examinant **le bon usage des JWT** et en identifiant les axes d’amélioration pour renforcer le backend.

---

## Observations et apprentissages de la séance

* Dès le début de la session, j’inspecte la circulation des **JWT** via le **F12 du navigateur**.
  Cela permet de vérifier que :

  * Le token est correctement transmis à chaque requête.
  * Les endpoints sensibles valident bien `req.seller.id`.
* L’analyse des données réseau confirme que les requêtes **ne révèlent pas d’informations d’autres utilisateurs**.
* Les services et modèles respectent l’isolation par `seller_id`. Même si un utilisateur tente d’injecter un ID arbitraire, les données restent protégées.
* Les logs côté serveur offrent une **traçabilité claire**, utile pour détecter des accès inhabituels.

---

## Ce que le backend bloque déjà

* Accès aux clients ou factures d’un autre seller → interdit.
* Création ou modification avec un `seller_id` arbitraire → refusée.
* Authentification obligatoire via JWT sur tous les endpoints critiques.
* Logging complet avec IDs seller et client pour faciliter le debug.

---

## Limites et points à améliorer

* **Token volé ou compromis** → JWT valide permet encore l’accès.
* Claims JWT pas toujours strictes (`iss`, `aud`, `scope`).
* Pas de **rotation des clés** ni de mécanisme de **revocation**.
* Certaines données sensibles apparaissent encore dans les logs.
* URLs publiques pour PDF / Factur-X peuvent être améliorées.

---

## Pistes d’amélioration

* Rotation de clés JWT et mécanisme de revocation.
* Vérification stricte des claims JWT (`iss`, `aud`, `scope`).
* Réduction de la durée de vie des JWT et utilisation de refresh tokens.
* Masquage des données sensibles dans les logs.
* Rate limiting pour limiter l’extraction massive de données.
* Vérification `seller_id` également côté services critiques.
* Sécurisation des URLs publiques pour PDFs et fichiers Factur-X.

---

## Ressenti de l’audit

* La sécurité multi-tenant est déjà **robuste** côté controller et modèle.
* Les vulnérabilités restantes concernent surtout **le vol de token et la gestion des JWT**.
* Les améliorations sont identifiées et facilement priorisables.

---

## Prochaines étapes

* Implémenter **claims strictes et rotation de clés**.
* Revoir le **logging et rate limiting**.
* Ajouter des tests pour **s’assurer que chaque seller ne peut jamais accéder aux données des autres**.

✅ Cette session permet à eInvoicing de progresser vers un backend **plus sûr et auditable**, tout en consolidant ma compréhension pratique des JWT et de l’isolation multi-tenant.
