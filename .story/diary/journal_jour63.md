# Jour 63 – Petit update du dimanche soir 📝✨

Aujourd’hui, pas grand-chose de concret côté dev, juste un **update rapide** pour garder le fil :  

---

## ✅ Points notables

- Les **boutons PDF/A-3** et PDF standard sont maintenant alignés, propres et cliquables directement depuis la liste des factures.  
- L’UI des actions de facture est **uniforme et sans cadres**, prête pour tous les tests.  

---

## 📌 Prochaines étapes pour clôturer le périmètre métier

- [ ] **Émission du cycle de vie d’encaissement** pour les factures  
  - Mettre à jour le **mock PDP** pour gérer le statut de paiement (`paid`) dans le lifecycle métier.  

- [ ] **Mise en conformité ISO du PDF/A-3**  
  - Finaliser tous les points techniques restants (métadonnées XMP, profils de couleur, `AFRelationship`) pour obtenir la **validation PDF/A-3 complète**.  

- [ ] **Règles de gestion métier** à appliquer :  
  - **Ne plus permettre de modifications** dès que la facture a été **transmise et réceptionnée côté PDP**.  
  - **Autoriser uniquement l’ajout de justificatifs** si la facture est en **suspension**.  

- [ ] [Optionnel] Gérer la recherche pour les tags traduits en français.  

---

💡 **Bilan rapide** : un dimanche tranquille, mais l’interface facture est maintenant **prête et propre**, et le reste des développements métiers peut être finalisé cette semaine. 🚀
