# Jour 41 – Premiers pas dans la construction du Factur‑X 📝💻

Aujourd’hui, focus sur **la préparation de la génération d’un fichier Factur‑X** et la mise en place de tous les outils nécessaires pour tester et valider le XML.

---

## ✅ Ce qu’on a fait

- **Création d’un script JavaScript** :  
  - Génération d’un fichier XML de test au format Factur‑X.  
  - Structure minimaliste mais conforme pour pouvoir expérimenter avec des données fictives.

- **Récupération des schémas XSD officiels** :  
  - Téléchargement depuis [fnfe-mpe.org](https://fnfe-mpe.org).  
  - Focus sur le profil **BASIC** pour simplifier les tests initiaux.

- **Installation et utilisation de `xmllint`** :  
  - Contrôles de validation en ligne de commande.  
  - Commande utilisée :  
    ```bash
    xmllint --noout --schema Factur-X_1.07.3_BASIC.xsd facturx.xml
    ```
  - Permet de vérifier que le XML généré est conforme au schéma officiel.

- **Tests de validation** :  
  - Plusieurs itérations pour corriger la structure et aligner le XML sur le XSD.  
  - Ajustement des éléments obligatoires et de l’ordre attendu par le schéma.

---

## 💪 Résultat

- Script **fonctionnel pour générer un Factur‑X de test**.  
- XML conforme au profil BASIC, validé avec `xmllint`.  
- Base solide pour ensuite intégrer des données réelles depuis ton application.

---

## 📌 Prochaines étapes

- Commencer à **injecter les données dynamiques** dans le script JS pour produire le Factur‑X réel.  
- Préparer l’export **PDF + XML** pour tests de bout en bout.  
- Planifier la **validation automatisée** côté backend à chaque génération de facture.

---

👉 Objectif du jour atteint : **premier Factur‑X minimal généré et validé, prêt à servir de modèle pour les prochaines factures 🚀**
