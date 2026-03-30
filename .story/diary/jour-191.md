# Jour #191 - Gestion des devis et rattachement aux factures 📄🔗

Aujourd’hui, nous mettons en place la **gestion des devis** et la possibilité de les rattacher aux factures.  

---

## Pourquoi ajouter un type `quote` ? 🧐

Pour identifier les devis dans le même modèle que les factures :  

- Un devis est simplement une **facture avec un type spécifique** : `invoice_type = quote`.  
- Cela permet de **réutiliser la même structure de données** sans créer une table séparée.  
- Chaque devis conserve sa propre **référence unique**, indépendante des factures.

---

## Rattacher un devis à une facture 🔗

- Lors de la création d’une facture, il est maintenant possible de **saisir la référence du devis d’origine**.  
- Les champs ajoutés :  
  - `original_quote_number` → référence visible du devis  

> Cela permet de garder un lien clair entre devis et facture, tout en conservant les devis **indépendants et non numérotés comme des factures**.

---

## Ce qui a été mis en place 🛠️

1. **Backend** : ajout du type `quote` et des champs `original_quote_*` dans le modèle `Invoice`.  
2. **Frontend** : possibilité pour l’utilisateur de saisir la référence d’un devis lorsqu’il crée une facture.  
3. **Flux futur** : préparer l’évolution vers un workflow complet devis → facture, sans modifier la numérotation existante.

---

### Conclusion 🎯

- Les devis ont désormais un **type dédié** et peuvent être liés aux factures.  
- Les devis **ne sont pas des factures** et **n’ont pas de numéro de facture** ; ils utilisent la même entité pour simplifier la structure.  
- On prépare le terrain pour un **flux complet de facturation** avec rattachement des devis, sans casser les données existantes.