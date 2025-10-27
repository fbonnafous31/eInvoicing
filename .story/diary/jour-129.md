# Jour 129 – Sécurisation des mots de passe SMTP 🔐

L’objectif du jour : **sécuriser le stockage des mots de passe SMTP en base de données** afin qu’ils ne soient jamais enregistrés ni exposés en clair.

---

## 🧠 Principe

Le mot de passe SMTP d’un vendeur est désormais **chiffré avant d’être stocké** dans la table `seller_smtp_settings`.
Lorsqu’il est utilisé pour l’envoi d’un e-mail, le backend le **déchiffre à la volée** grâce à une clé secrète définie dans les variables d’environnement (`ENCRYPTION_KEY`).

Le front ne voit donc jamais le mot de passe en clair :

- à la lecture, la valeur affichée est chiffrée ;
- à la saisie, un nouveau mot de passe peut être entré en clair, mais il est immédiatement chiffré avant enregistrement.

---

## ✅ Résultat

- Les mots de passe SMTP sont **protégés au repos**.  
- **Aucune fuite possible** côté front ni dans les logs.  
- Le cycle complet chiffrement/déchiffrement est **transparent et automatisé** côté backend.  

La partie sécurité SMTP est désormais **entièrement bouclée**.