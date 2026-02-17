# Jour 176 – Mise à jour de la DB et vue sécurisée pour le LLM 🗄️🛡️

Aujourd’hui, l’objectif était de **préparer la base de données pour l’usage du LLM** en créant un **schéma dédié** et une **vue sécurisée**, tout en **préservant les données sensibles** des clients et vendeurs.

---

## 🎯 Objectif de la session

* Ajouter un **schéma dédié `llm`** pour isoler les vues utilisées par le LLM.  
* Créer une **vue `llm_factures`** qui contient toutes les informations utiles pour l’analyse ou la génération de texte.  
* **Masquer toutes les données personnelles** des clients et des vendeurs (ne garder que l’ID et le nom).  
* Inclure les **lignes de facture, TVA et historique de statuts** pour un contexte complet.

---

## 🛠️ Travail technique effectué

* Création d’un **schéma `llm`** pour isoler les vues destinées au LLM.  
* Définition d’une **vue `llm_factures`** qui ne remonte que les colonnes nécessaires : info facture, ID et nom de client/vendeur.  
* Ajout des **lignes de facture, TVA et statuts** pour conserver le contexte métier utile au LLM.  

### Pourquoi `json_agg` ?

Pour les lignes de facture, TVA et statuts, il existe souvent **plusieurs enregistrements par facture**.  
Si on faisait un simple `JOIN`, chaque facture serait **répliquée autant de fois qu’il y a de lignes**, ce qui complexifie l’exploitation côté LLM.  

`json_agg` permet de **regrouper toutes les lignes associées à une facture dans un tableau JSON unique** :  

* Chaque facture reste **une seule ligne dans la vue**.  
* Les informations détaillées (lignes, TVA, statuts) sont **encapsulées dans des tableaux JSON**, faciles à parcourir par le LLM.  
* On évite ainsi les **doublons et répétitions**, tout en gardant **toutes les données métier utiles**.  

---

## 🧪 Résultats

✅ Schéma `llm` disponible pour les vues LLM.  
✅ Vue `llm_factures` sécurisée et prête pour le LLM.  
✅ Données sensibles (**emails, adresses, numéros, IBAN**) **non exposées**.  
✅ Les **détails de factures, lignes, TVA et statuts** sont inclus pour enrichir les prompts.

---

## 💭 Ressenti / humain

* La base est **prête pour l’étape LLM**, avec un périmètre sécurisé et structuré.  
* Utiliser `json_agg` a permis de **simplifier l’exploitation des données**, tout en conservant le contexte complet.  
* Confiance et sécurité renforcées pour **l’utilisation du LLM sur les données de facturation**.
