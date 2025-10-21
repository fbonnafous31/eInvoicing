# Jour 124 – Réflexion et mise en place de l’envoi de mail 📧⚙️

L’objectif du jour : **réfléchir à l’envoi de factures par mail**, tester les options disponibles côté backend et définir la mise en œuvre future côté utilisateur.

---

## 🛠️ Réflexion sur l’envoi de mails

J’ai commencé par **penser à l’envoi automatique ou manuel de factures** depuis l’application. Plusieurs points sont apparus :

* L’envoi de mail **peut se faire uniquement si la facture dispose déjà d’un justificatif PDF/A-3**.
* Côté front, le bouton d’envoi peut être masqué ou activé selon le plan ou les préférences utilisateur.
* L’intégration directe d’un service SMTP externe (Gmail, Outlook, Brevo) **pose des contraintes techniques et de sécurité**, notamment l’authentification et la gestion des quotas.
* Une autre approche consiste à **laisser chaque utilisateur configurer son propre serveur SMTP**, ce qui simplifie la maintenance côté produit tout en donnant la flexibilité nécessaire.

> L’objectif est de prévoir l’envoi de mails **sans bloquer l’expérience actuelle**, même si la configuration SMTP n’est pas encore généralisée.

---

## ⚙️ Mise en place côté backend

Pour préparer l’envoi de mails, j’ai implémenté :

1. **Service `invoiceMail.service.js`**

   * Fonction `sendInvoiceMail(invoiceId, message)` qui récupère la facture et ses pièces jointes PDF/A-3.
   * Utilisation de **Nodemailer** pour créer le transport SMTP et envoyer le mail.
   * Gestion des erreurs : facture ou client manquant, PDF introuvable, échec de l’envoi.

2. **Paramètres SMTP configurables**

   * Variables d’environnement (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) prêtes à être utilisées.
   * Pour l’instant, le front **n’expose pas le bouton d’envoi**, ce qui évite les problèmes de configuration utilisateur.

3. **Flexibilité pour l’avenir**

   * Le backend est opérationnel et peut envoyer un mail si les paramètres SMTP sont corrects.
   * Possibilité future de proposer aux utilisateurs de **paramétrer leur propre SMTP**, avec tests de validité et sauvegarde dans leur profil.

---

## 🔮 Vision pour l’intégration utilisateur

* Le bouton d’envoi sera affiché uniquement si l’utilisateur a **validé ses paramètres SMTP**.
* On pourra ajouter un **bouton de test** qui permet de vérifier la connexion et l’authentification avant tout envoi réel.
* Pour les offres, l’envoi de mail pourra rester en option **Essentiel ou Pro**, à la charge de l’utilisateur de configurer son serveur.

> L’idée est de garder le back prêt, mais de **ne pas imposer une configuration SMTP complexe à tous les utilisateurs dès maintenant**.

---

## 🚀 Prochaine étape

* Ajouter un **menu de paramétrage SMTP** côté profil utilisateur.
* Implémenter un **bouton “Tester la configuration”** pour vérifier les identifiants et l’envoi vers sa propre adresse.
* Déterminer comment **activer l’envoi de mails** dans les différentes offres (Essentiel, Pro).

> L’objectif final : que chaque utilisateur puisse envoyer ses factures par mail **sans dépendre de moi**, tout en gardant le code backend prêt et fonctionnel.
