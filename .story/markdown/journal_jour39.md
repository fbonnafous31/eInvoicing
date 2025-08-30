# Jour 39 – Visionneuse PDF et gestion des justificatifs 🖥️📄

Aujourd’hui, focus sur la consultation des factures avec intégration des PDF réels depuis le backend et la stabilisation du composant **PdfViewer**.

## ✅ Ce qu’on a fait

- **Récupération dynamique des PDF** :  
  - Les URLs sont générées côté backend via `VITE_API_URL`.  
  - Sélection automatique du PDF principal (`attachment_type === "main"`).  
  - Support pour plusieurs pièces jointes avec onglets pour naviguer entre elles.

- **Visionneuse PDF améliorée** :  
  - Navigation page par page avec boutons de contrôle.  
  - Zoom responsive et ajustable en pourcentage.  
  - Téléchargement dans un nouvel onglet avec nom de fichier dynamique basé sur l’ID de la facture.

- **Interface et UX** :  
  - Breadcrumb au-dessus du formulaire et du PDF pour cohérence.  
  - Mise en page en deux colonnes : formulaire à gauche, PDF à droite avec scroll indépendant.  
  - Onglets pour accéder aux autres justificatifs et notes de crédit.

## 💪 Résultat

- Rendu PDF fluide et responsive, directement depuis le backend.  
- InvoiceView affiche correctement formulaire et PDF côte à côte, navigation et zoom opérationnels.  
- Justificatifs multiples accessibles via des onglets clairs.

## 📌 Prochaines étapes

- Génération **Factur-X** : PDF/A-3 + XML structuré, conforme à la réglementation.

👉 **Objectif du jour atteint** : PDF dynamique fonctionnel, navigation, zoom et téléchargement opérationnels, setup prêt pour les justificatifs multiples 🚀
