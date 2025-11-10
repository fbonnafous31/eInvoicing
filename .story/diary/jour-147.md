# Jour 147 – Adapter, agnostique et pragmatique : la tech au service du produit ⚙️✨

Aujourd’hui, j’ai pris un moment pour réfléchir à l’architecture de eInvoicing et aux choix techniques qui ont émergé **au fil des besoins réels**. Plutôt que de suivre un dogme d’architecture, j’ai laissé le produit dicter la tech.

🎯 Objectif
Rendre le code **souple, testable et prêt à évoluer**, tout en restant simple et compréhensible. Adapter là où c’est nécessaire pour que chaque partie puisse évoluer indépendamment : base de données, stockage, PDF, PDP.

✅ Décisions et observations

* **DB agnostique**
  Initialement, la base était liée à un seul schéma local. Aujourd’hui, elle peut gérer plusieurs instances (`staging`, `preprod`, `prod`) sans toucher au cœur métier. Cela permet de tester, déployer et itérer rapidement.

* **PDP flexible**
  Chaque plateforme de dématérialisation est maintenant un **adapter** derrière une interface commune. Le cœur métier n’a aucune idée de quel PDP est utilisé. Ajouter un nouveau partenaire est trivial et ne casse rien.

* **Stockage cloud ou local**
  Le même service gère à la fois le stockage local et Backblaze B2. Le code métier ne connaît pas la destination finale des fichiers. Cela rend le projet prêt pour le cloud tout en conservant le workflow local pour le développement et les tests.

* **PDF et Factur-X découplés**
  La génération des PDF/A-3 et des fichiers Factur-X est isolée du stockage et du front. Chaque étape est indépendante, testable et facilement remplaçable si besoin.

* **Tests et mocks**
  Grâce aux adapters, le cœur métier peut être testé isolément. Je peux simuler des PDP, des fichiers ou la base de données sans toucher à la production. Les tests sont rapides et fiables.

🌱 Ressenti
Ce que j’ai compris, c’est que **l’agnosticisme et l’usage d’adapters n’est pas une fin en soi**, mais une réponse pragmatique aux besoins :

* J’ai voulu basculer sur le cloud → j’ai ajouté un adapter B2 sans toucher au métier.
* J’ai voulu multiplier les PDP → chaque plateforme a son propre adapter.
* Le cœur métier reste **stable, clair et testable**, peu importe le nombre d’environnements ou de services externes.

C’est exactement la dimension que je recherchais : **la tech sert le produit, pas l’inverse**. Chaque abstraction, chaque interface est là pour que l’application reste simple à utiliser, robuste et prête à évoluer.

🖼️ Schéma simplifié de l’architecture

```
        🌐 FRONTEND (React / Vite)
        ------------------------
        Pages / Composants
        Services API
                |
                v
       ⚡ CŒUR MÉTIER (Services)
       -------------------------
       Factures | Clients | Vendeurs
       Génération PDF/A-3 / Factur-X
                |
   +------------+------------+
   |            |            |
   v            v            v
📦 DATABASE   📂 STORAGE   🔗 PDP / EXTERNAL
PostgreSQL   Local / B2   API Sandbox
CRUD Models  save/load()  sendInvoice()
```

✅ Bilan du jour

* Prise de recul sur l’architecture et sa cohérence.
* Validation que le choix d’adapters et d’agnosticisme est **pragmatique et utile**.
* Confirmation que eInvoicing est maintenant prêt à évoluer facilement : nouveaux PDP, stockage cloud, environnements multiples, sans compromettre le cœur métier.
