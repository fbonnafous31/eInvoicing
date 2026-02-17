# Jour 175 – Mise en place d’un MCP pour donner du contexte au LLM 🤖🔗

Aujourd’hui, l’objectif était de **préparer l’intégration d’un MCP (Model-Context-Proxy)** pour permettre à notre backend d’eInvoicing de **discuter avec un LLM de manière sécurisée et contextuelle**, sans exposer toute la base de données ni perdre le contrôle.  

---

## 🎯 Objectif de la session

* Comprendre **ce qu’est un MCP** et son rôle dans l’architecture LLM + infra.  
* Installer et tester **LLaMA3 via Ollama** pour valider le modèle gratuit localement.  
* Préparer la **structure pour limiter le scope des données** accessibles au LLM.  
* Identifier **les implications RGPD et sécurité** avant de donner l’accès au modèle.  

> L’idée : avoir un **LLM qui peut répondre aux questions métier** (ex : chiffre d’affaires, factures) en utilisant uniquement les données pertinentes, sans exposer l’intégralité de la DB.

---

## 🛠️ Travail technique effectué

### 1. Comprendre le MCP

* Le **MCP agit comme un intermédiaire entre le LLM et l’infrastructure**.  
* Il **fournit au LLM un contexte limité**, défini par l’infra, pour qu’il ne voie que ce qu’on veut exposer.  
* Concrètement : pour eInvoicing, on pourra lui donner **une vue SQL contenant seulement les factures et les noms de clients**, rien de sensible.  
* Les permissions et la portée des données restent **gérées côté backend/DB**, le LLM ne fait que “lire” ce qu’on lui donne.

### 2. Choix du LLM

* Test de **LLaMA3 via Ollama** sur machine locale : ✅  
* Installation du modèle et test en CLI pour vérifier qu’il répond correctement aux prompts.  
* Pour le POC, **tout est local**, aucune modification du backend Docker n’est nécessaire pour l’instant.

### 3. Définir le scope des données

* Décision : **créer une vue SQL dédiée** qui expose uniquement les colonnes nécessaires pour les requêtes métier.  
  - Exemple : `SELECT invoice_number, amount, client_name, date FROM invoices`  
* Le LLM pourra **analyser les données et répondre aux questions** sans jamais accéder aux informations sensibles (ex : emails, adresses, totaux confidentiels).  

### 4. Préparer le backend

* Pour le POC, le backend reste inchangé.  
* Plus tard : création d’un **endpoint `/chat`** qui interagira avec le MCP pour envoyer les prompts et récupérer les réponses.  

---

## 🧪 Résultats

✅ LLaMA3 fonctionne en local et répond aux prompts simples.  
✅ MCP et concept de scope validés théoriquement : le LLM **n’a accès qu’aux données filtrées via la vue SQL**.  
✅ Aucun impact sur le backend ou Docker pour l’instant : **test entièrement local et sécurisé**.  

---

## 💭 Ressenti / humain

* Impressionnant de voir que l’on peut **connecter un LLM à notre base métier** sans tout exposer.  
* La notion de **perte de contrôle relative** est présente : on donne “la main” au LLM sur un scope limité, mais tout reste sous contrôle infra.  
* Enthousiasmant : ça ouvre la porte à des **agents intelligents dédiés à nos cas d’usage** (analyse de factures, suivi clients, reporting simple).  
* Nécessité de **penser sécurité et RGPD** dès maintenant pour préparer un vrai déploiement.

---

## ✅ Bilan du jour

* MCP compris et rôle clarifié : ✅  
* LLaMA3 installé et testé localement : ✅  
* Vue SQL filtrée pour limiter le scope du LLM : ✅  
* Backend inchangé, POC sécurisé et isolé : ✅  
* Base pour futur endpoint `/chat` prête : ✅  

> Une journée exploratoire mais essentielle : **nous posons les fondations pour un LLM métier capable de répondre intelligemment et de manière sécurisée aux questions des utilisateurs**.
