# Jour 42 – Génération d’un Factur‑X à partir des données réelles 📝💻

Aujourd’hui, focus sur **la génération d’un XML Factur‑X à partir des données de la facture réelle** et la validation avancée avec les outils officiels.

---

## ✅ Ce qu’on a fait

- **Adaptation du script de génération** :  
  - Injection des données réelles du front dans le XML (vendeur, client, lignes, taxes, totaux).  
  - Ajout du bloc **`InvoiceReferencedDocument`** pour les factures précédentes.  
  - Mise en conformité avec le schéma XSD officiel pour éviter les erreurs **BR‑CO‑25** et **BR‑S‑02**.

- **Gestion des champs obligatoires** :  
  - Vérification que le **numéro de TVA du vendeur** est toujours présent pour les lignes à TVA standard.  
  - Bloc **`SpecifiedTradePaymentTerms`** ajouté pour respecter la règle sur la date d’échéance.

- **Validation du XML** :  
  - Première passe avec `xmllint` pour vérifier la conformité avec le XSD **Factur-X_1.07.3_BASIC**.  
    ```bash
    xmllint --noout --schema xsd/Factur-X_1.07.3_BASIC.xsd 168.xml
    ```
  - Validation finale sur le **service officiel FNFE‑MPE** pour s’assurer que toutes les règles Schematron sont respectées :  
    [https://services.fnfe-mpe.org/account/home](https://services.fnfe-mpe.org/account/home)

- **Corrections itératives** :  
  - Ajustement des noms d’éléments et de l’ordre pour correspondre exactement aux attentes du schéma.  
  - Gestion des erreurs liées aux dates, aux références de factures et aux identifiants fiscaux.

---

## 💪 Résultat

- **XML Factur‑X généré à partir de vraies données**, conforme au profil BASIC.  
- Validé à la fois **en local** (`xmllint`) et **en ligne** (FNFE‑MPE).  
- Base solide pour la **prochaine étape** : combiner le XML avec le PDF pour obtenir un **PDF/A‑3 au format Factur‑X**.

---

## 📌 Prochaines étapes

- Intégrer le **PDF correspondant à la facture** pour générer un PDF/A‑3 complet.  
- Automatiser la **génération et la validation côté backend** pour chaque facture émise.  
- Préparer la **saisie obligatoire du numéro de TVA vendeur** dans la fiche pour éviter tout rejet de Factur‑X.

---

👉 Objectif du jour atteint : **un Factur‑X réel généré et validé, prêt pour être intégré au PDF/A‑3 🚀**
