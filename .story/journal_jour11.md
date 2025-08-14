# Jour 11 – Les factures et leurs justificatifs 📄

Aujourd’hui, j’ai plongé dans une étape clé : **la gestion des factures et des justificatifs**. Jusqu’ici, j’avais les vendeurs et les clients, mais le flux de facturation n’était pas encore complet.  

---

## 🎯 Objectif

- Créer un **jeu de données réaliste pour les factures** (`invoices`) avec :  
  - Une à quatre lignes par facture (`invoice_lines`).  
  - Une assiette de TVA par facture (`invoice_taxes`).  
  - Un ou plusieurs justificatifs (`invoice_attachments`), en s’assurant qu’il y ait **exactement un justificatif principal** et éventuellement 1 à 2 supplémentaires.  
- Mettre en place un **chemin de stockage cohérent** pour les fichiers PDF (`/uploads/invoices/`) selon les meilleures pratiques.  

---

## 🛠 Côté backend

1. **Tables et relations**
   - `invoices` : contient toutes les informations principales (numéro, dates, montant, vendeur, client).  
   - `invoice_lines` : détail des produits ou services, calcul des montants HT et TTC.  
   - `invoice_taxes` : assiette de TVA par facture, majoritairement un seul taux.  
   - `invoice_attachments` : fichiers PDF avec le nouveau champ `attachment_type` (`main` ou `additional`).  

2. **Mise à jour des chemins**
   - Tous les `file_path` des justificatifs sont maintenant uniformisés vers `/uploads/invoices/`.  
   - Chaque fichier conserve son nom mais est centralisé dans ce dossier dédié.  

3. **Données cohérentes et réalistes**
   - 10 factures créées avec des montants, lignes et taxes cohérents.  
   - Chaque facture a **au moins un justificatif principal**, certaines avec un ou deux fichiers supplémentaires.  
   - Les séquences PostgreSQL ont été remises à jour pour garantir l’unicité des `id`.  

---

## 💻 Côté frontend

- Les fichiers restent accessibles via l’API Express, en respectant le nouveau chemin :  

```javascript
app.use('/files/invoices', express.static(path.join(__dirname, '../uploads/invoices')));
```

- À terme, les composants frontend pourront afficher et télécharger les justificatifs en fonction de leur type (`main` ou `additional`) sans se soucier du chemin physique exact.  

---

## 📚 Ce que j’ai appris

- **La structuration des fichiers uploadés** est essentielle : un dossier dédié et des noms cohérents simplifient beaucoup la maintenance.  
- **L’intégrité des données** (1 `main` par facture, ligne/TTC cohérentes) est beaucoup plus simple à gérer si elle est réfléchie dès la création du jeu de données.  
- **PostgreSQL sequences** : toujours remettre à jour après un insert avec `id` explicite pour éviter les conflits futurs.  

---

## 🚀 Prochaines étapes

- Visualiser **la liste des données des factures**
- Intégrer **la création de factures côté frontend**, avec sélection vendeur + client.  
- Ajouter la possibilité de **uploader les justificatifs** directement depuis l’interface.  
- Mettre en place la **gestion des états de facture**.
