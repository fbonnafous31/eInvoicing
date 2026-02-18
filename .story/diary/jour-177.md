# Jour 177 – Installation et configuration de MCP pour LLaMA 🖥️🤖

Aujourd’hui, l’objectif était de **mettre en place MCP (Module Contextuel pour LLM)** afin de pouvoir **fournir un contexte métier structuré à LLaMA** pour répondre aux questions sur les factures.

---

## 🎯 Objectif de la session

* Installer MCP dans le projet backend Node.js.
* Configurer les **fichiers `mcp.config.js` et `mcp.service.js`** pour gérer les requêtes LLM.
* Définir un **pipeline sécurisé pour envoyer uniquement les données pertinentes** (totaux par année, top clients, factures en retard) au LLM.
* Tester l’intégration avec des **prompts métier réels**.

---

## 🛠️ Travail technique effectué

* Création du **module MCP** avec :

  * `mcp.server.js` → route `/query` pour recevoir les questions.
  * `mcp.config.js` → configuration des endpoints et des scopes.
  * `mcp.service.js` → préparation des prompts et appel local de LLaMA via Ollama.

* Mise en place d’une **logique côté backend** pour :

  * Calculer les **totaux par année**.
  * Identifier les **top clients par année**.
  * Lister les **factures impayées depuis plus de 30 jours**.

* Construction d’un **prompt synthétique et générique** :

  * Contient uniquement les données utiles pour la question posée.
  * Permet au LLM de répondre de manière **claire et concise**, sans inventer de calculs.

* Tests réalisés avec différents types de requêtes :

  * “Quel est le chiffre d’affaires total pour l’année 2025 ?” ✅
  * “Quels sont les top clients 2025 ?” ✅
  * “Quelles factures sont en retard de plus de 30 jours ?” ✅

---

## 🧪 Résultats

✅ MCP fonctionne et reçoit les questions via `/mcp/query`.
✅ LLaMA répond correctement aux questions **avec le contexte fourni**, de manière synthétique.
✅ La **latence est raisonnable** pour le volume de données filtrées.
✅ Le service est **flexible** et permet d’ajouter facilement de nouveaux types de contextes ou calculs.

---

## 💭 Ressenti / humain

* MCP apporte une **valeur ajoutée par rapport au tableau de bord** : il peut **répondre en langage naturel** et expliquer ou synthétiser les données.
* Les calculs restent fiables car ils sont faits **côté backend**.
* Le plus dur est de **déterminer le contexte minimal et suffisant** pour chaque question, afin d’éviter de surcharger le LLM.
* C’est un outil **utile pour des questions métier interactives ou des rapports synthétiques**, mais pas nécessaire si on ne veut que des chiffres bruts.
