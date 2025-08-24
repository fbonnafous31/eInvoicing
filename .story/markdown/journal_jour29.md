# Jour 29 – Composants de facture stabilisés 💡📄

Aujourd’hui, j’ai continué à travailler sur la partie **“Facture”** de l’application.  
L’objectif était d’avoir des composants **fonctionnels, cohérents et testables** sans se perdre dans des hooks trop complexes.

---

## ✅ Ce qu’on a fait

- **InvoiceHeader** : champs éditables et validation basique opérationnels.  
- **InvoiceLines** : affichage et saisie des lignes de facture corrigés, avec gestion des montants.  
- **TaxBases** : calcul automatique des assiettes de TVA, avec ajout/suppression dynamique.  
- **Abandon (temporaire)** du hook custom trop instable → retour à une structure simple, claire et robuste avec props et state.  
- Les messages d’erreur s’affichent désormais **au bon moment** (validation au blur + soumission).  

---

## 💪 Le résultat

On a maintenant une facture qui respire :  

- Les inputs sont utilisables et cohérents.  
- Les montants et taxes se recalculent correctement.  
- Le code est plus lisible et facile à maintenir.  

---

## 🔜 Prochaines étapes

- Améliorer l’UX (meilleure gestion des erreurs et de la validation).  
- Revoir l’idée d’un **hook global** uniquement quand les composants seront totalement stabilisés.  
- Travailler la **cohérence visuelle** de l’ensemble (layout & ergonomie).  
