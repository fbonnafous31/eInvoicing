# eInvoicing – Checklist de validation par environnement

## 1) Inscription & Connexion

| Fonctionnalité           | Points à vérifier                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Formulaire d’inscription | - Saisie email + mot de passe + adresse OK<br>- Contrôle format email<br>- Contrôle longueur / complexité mot de passe |
| Acceptation des CGU      | - Case à cocher obligatoire                                                                                            |
| Email de confirmation    | - Email envoyé automatiquement<br>- Lien valide<br>- Le compte passe à l’état *confirmé*                               |
| Connexion                | - Authentification OK<br>- Déconnexion OK                                                                              |

---

## 2) Profil Vendeur

| Fonctionnalité                | Points à vérifier                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formulaire première connexion | - Blocage de l’accès à l’app si profil vendeur non créé                                                                                                                        |
| Champs obligatoires           | - Nom légal<br>- Identifiant légal (SIRET)<br>- Adresse, code postal, ville<br>- Pays                                                                                          |
| Contrôles automatiques        | - SIRET (format + clé)<br>- Email (format)<br>- Téléphone (format)<br>- Code postal (format)<br>- IBAN (format + clé)<br>- BIC (format)                                        |
| Validation                    | - Blocage si champ manquant ou invalide                                                                                                                                        |
| Enregistrement                | - Une seule fiche vendeur possible par utilisateur<br>- Verrouillage après validation initiale                                                                                 |
| Paramètres SMTP               | - Accès au formulaire SMTP<br>- Saisie hôte, port, utilisateur, mot de passe<br>- Test de connexion SMTP OK<br>- Sauvegarde persistante<br>- Blocage si configuration invalide |

---

## 3) Répertoire Client

| Fonctionnalité          | Points à vérifier                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Création d’un client    | - Accessible via Menu **Client → Créer** ou lors de la création de facture                        |
| Données obligatoires    | - Nom du client<br>- Adresse complète<br>- Identifiant légal si professionnel                     |
| Contrôles automatiques  | - SIRET (si renseigné)<br>- IBAN + BIC (si renseignés)<br>- Téléphone<br>- Email<br>- Code postal |
| Mise à jour automatique | - Modification par création de facture met à jour la fiche client                                 |

---

## 4) Création de Facture

| Fonctionnalité            | Points à vérifier                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès                     | Menu **Facture → Créer**                                                                                                                                      |
| Champs obligatoires       | - Référence facture<br>- Date d’émission<br>- Exercice fiscal<br>- Client sélectionné ou créé<br>- Au moins une ligne de facture<br>- Un justificatif associé |
| Mises à jour automatiques | - Mise à jour de la fiche client via saisie facture                                                                                                           |
| Calculs automatiques      | - TVA (toutes lignes)<br>- Totaux HT, TVA, TTC                                                                                                                |
| Génération PDF devis      | - PDF généré correctement<br>- Contient toutes les informations du devis<br>- Format lisible et conforme                                                      |
| Génération PDF facture    | - PDF Factur-X généré correctement<br>- Conforme ISO 19005 (PDF/A-3)<br>- Contient toutes les informations obligatoires                                       |
| Envoi par mail            | - Utilisation paramètres SMTP<br>- Possibilité de personnaliser contenu mail<br>- Pièce jointe PDF correcte<br>- Statut facture mis à jour après envoi        |
| Édition                   | - Modifiable tant qu’elle n’est pas transmise                                                                                                                 |

---

## 5) Communication Plateforme Agréée (PA)

| Fonctionnalité           | Points à vérifier                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Envoi de facture         | - Transmission OK<br>- Passage en statut « Mise à disposition »<br>- Facture devient non modifiable                                                                       |
| Récupération du statut   | - Statuts possibles gérés correctement : Mise à disposition / Prise en charge / Approuvée / Approuvée partiellement / En litige / Suspendue / Refusée / Paiement transmis |
| Règles métier            | - Suspension → possibilité d’ajouter un complément → statut passe en « Complétée »<br>- Refus → cycle arrêté<br>- Paiement transmis → demande statut d’encaissement       |
| Déclaration encaissement | - Notification envoyée à la PA<br>- Cycle clôturé                                                                                                                         |

---

## 6) Tableau de bord & Pilotage

| Fonctionnalité       | Points à vérifier                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Vue synthèse         | - Totaux mensuels chargés<br>- Liste factures en retard<br>- Répartition statuts factures |
| Indicateurs business | - Top clients<br>- Évolution des ventes mensuelles                                        |
| Rafraîchissement     | - Données mises à jour après création / envoi de facture                                  |
