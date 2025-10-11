# Jour 107 – Première interaction “réelle” avec le PDP 🎯💻

Aujourd’hui, c’est un vrai petit saut dans le concret : je touche enfin **la sandbox Iopole** et ça change tout le feeling du projet.

---

## 📤 Envoi de facture & suivi

J’ai pu vérifier tout le cycle :

* J’envoie une facture → elle est bien **reçue par la sandbox**.
* La DB est correctement mise à jour avec le **statut et le submission_id**.
* Je demande le **statut technique** → la requête passe, la sandbox répond même si le SIRET vendeur n’est pas valide.
* J’envoie un **statut “PAYMENT_RECEIVED”** → il est pris en compte sans erreur, et je reçois le retour exact de la plateforme.

C’est hyper satisfaisant de voir que, même sans que la sandbox soit à jour de son côté, **mon application communique correctement avec le PDP** et reçoit des réponses valides.

---

## 🔧 Les détails techniques de la matinée

* **FetchStatus dans l’adapter** : maintenant je récupère correctement le dernier statut PDP.
* **SchemeId pour le Factur-X** : j’ai pris en compte le `0009` spécifique pour Iopole.
* **Gestion des messages PDP côté front** : je n’affiche plus tout le payload, mais uniquement le `rejectionMessage`, et je préviens l’utilisateur que le message vient bien du PDP.

Tout ça fonctionne avec le **mock, la sandbox et le vrai back**, sans casser la compatibilité.

---

## 😅 Difficultés rencontrées

Le plus frustrant : **pas de vendeur de test qui retourne un statut métier valide**.
Même si la plateforme répond, on ne peut pas encore tester tous les cas réels côté métier.
C’est un peu comme toucher la vraie vie, mais avec des gants : on voit le système fonctionner, mais pas toutes les interactions possibles.

---

## ✅ Conclusion

Ce matin, j’ai fait un **grand pas** :

* Mon application n’est plus qu’un mock local, elle interagit avec **une vraie sandbox**.
* Je maîtrise maintenant **l’envoi et la réception des statuts** avec PDP.
* Même si tout n’est pas exploitable en production, c’est un **upgrade massif de mes connaissances** et de mon workflow.

Je me sens prêt à attaquer la suite avec une vraie base solide pour 2026 🚀
