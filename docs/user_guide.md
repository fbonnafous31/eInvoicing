# eInvoicing – User Guide

## Etape 1 – Inscription
1. S'inscrire sur l'application  
   ![Inscription1](./images/inscription1.png)
2. Ajouter une adresse et définir un mot de passe  
   ![Inscription2](./images/inscription2.png)
3. Accepter les conditions  
   ![Inscription3](./images/inscription3.png)
4. Valider l'inscription via le mail de confirmation  
   ![Inscription4](./images/inscription4.png)

---

## Etape 2 – Éditer le profil vendeur
À la première connexion, il est nécessaire de créer un profil vendeur avec les informations minimales pour la facturation.

![Profil1](./images/profil1.png)

**Mentions minimales :**
- Nom légal
- Identifiant légal (SIRET pour les vendeurs français)
- Adresse
- Code postal
- Ville
- Pays (FR par défaut)

**Contrôles automatiques :**
- SIRET : format et clé
- Email : format
- Numéro de téléphone : format
- Code postal : format
- IBAN : format et clé
- BIC : format
- Présence des données obligatoires

> Un vendeur ne peut être créé si des informations obligatoires sont manquantes ou invalides.

---

## Etape 3 (facultatif) – Mettre à jour le répertoire client
- Menu : **Client → Créer**  
- Possibilité de créer un client depuis la fiche client ou directement à la création d’une facture s’il n’existe pas.  

![Client1](./images/client1.png)

**Contrôles automatiques pour les clients :**
- SIRET : format et clé
- Email : format
- Numéro de téléphone : format
- Code postal : format
- IBAN : format et clé
- BIC : format
- Présence des données obligatoires

> Si des données clients sont manquantes, elles doivent être complétées lors de la saisie de la facture.

---

## Etape 4 – Créer la facture
- Menu : **Facture → Créer**  

![Facture1](./images/facture1.png)

**Contrôles automatiques :**
- Validité des informations client (SIRET, email, téléphone, code postal)  
- Présence des informations obligatoires :
  - De la facture : référence, date d’émission, exercice fiscal, données client, au moins une ligne de facture et un justificatif
  - Du client : type, identification, adresse  

> Les informations saisies sur la facture mettent à jour automatiquement la fiche client.

**Fonctionnalités automatiques :**
- Calcul automatique des assiettes TVA
- Génération du justificatif de facture conforme

![Facture2](./images/facture2.png) 
![Facture3](./images/facture3.png)  
![Facture4](./images/facture4.png)

- La facture reste modifiable tant qu’elle n’a pas été transmise à une plateforme agréée.  
- Le document légal Factur-X (PDF/A-3) est accessible et téléchargeable, conforme à l’ISO 19005.  

![Facture5](./images/facture5.png) 
![Facture6](./images/facture6.png) 
![Facture7](./images/facture7.png) 

---

## Etape 5 – Communiquer avec la plateforme agréée
1. **Envoyer la facture**

![pa-sendInvoice1](./images/pa-sendInvoice1.png)  
![pa-sendInvoice2](./images/pa-sendInvoice2.png)

- Une fois mise à disposition, le statut de la facture est mis à jour et la facture ne peut plus être modifiée.  
  
---

2. **Demander le statut de la facture**

![pa-fetchStatus1](./images/pa-fetchStatus1.png)  
![pa-fetchStatus2](./images/pa-fetchStatus2.png)

**Statuts possibles :**
- Mise à disposition
- Prise en charge
- Approuvée
- Approuvée partiellement
- En litige
- Suspendue
- Refusée
- Paiement transmis

**Règles de gestion :**
- Suspension → possibilité d’ajouter un complément et de réémettre la facture (statut passe à « Complétée »)  
- Refus → cycle terminé  
- Paiement transmis → obligation d’envoyer un statut d’encaissement pour clore le cycle

---

3. **Accuser l’encaissement d’une facture**

![pa-sendStatus1](./images/pa-sendStatus1.png)  
![pa-sendStatus2](./images/pa-sendStatus2.png)

---

## Etape 6 – Piloter les factures
Le tableau de bord permet de suivre la facturation :  
- Identification des meilleurs clients  
- Évolution des ventes mensuelles  
- Statut des factures en cours de traitement  
- Liste des factures en retard de paiement  

![dashboard](./images/dashboard.png)
