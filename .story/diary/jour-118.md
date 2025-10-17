# Jour 118 – CGU, token et déploiement GitHub Pages 🚀📄

Aujourd’hui, on a avancé sur plusieurs **points clés pour rendre eInvoicing plus mature et prêt à être partagé**, en mélangeant aspects techniques et expériences utilisateur.

---

## 🔄 Renouvellement automatique du token

J’ai vérifié que le **token utilisateur se renouvelle automatiquement avant expiration**.
C’est un détail technique côté backend, mais il assure **une expérience fluide sans interruption**, surtout pour les tests et les démonstrations.

---

## 📄 Ajout des CGU et du bandeau expérimental

Ensuite, j’ai intégré **les Conditions Générales d’Utilisation (CGU)** directement sur le site :

* Les CGU sont accessibles depuis le footer de mon site.
* Un **bandeau fixe** annonce clairement que le projet est expérimental.
* Le bandeau reste visible sur toutes les pages, **pour plus de transparence** dès l’arrivée sur le site.

Côté expérience utilisateur, ça permet **d’informer immédiatement les visiteurs** sur le statut du produit et les règles de confidentialité, sans nuire à la navigation.

---

## 🌐 Préparation et test du déploiement sur GitHub Pages

Enfin, j’ai préparé le terrain pour **mettre la landing page en ligne** :

* Configuration Vite adaptée pour GitHub Pages (`base: '/eInvoicing-landing/'`).
* Script `gh-pages` pour déployer automatiquement le dossier `dist`.
* Tests en local pour vérifier que **tout le site est visible dès l’arrivée**, pas seulement la navbar et le bandeau.
* Petit focus sur le **hash `#hero`** pour que la page ouvre directement sur la section principale.

Le but : pouvoir partager le site en toute sécurité et en mode **démo accessible**, même si le projet reste expérimental.

---

## 🌟 Bilan du matin

| Élément                     | Avancée                                   | Impact                                   |
| --------------------------- | ----------------------------------------- | ---------------------------------------- |
| Token utilisateur           | ✅ Renouvellement automatique mis en place | Expérience fluide sans interruption      |
| CGU                         | ✅ Intégrées                               | Transparence et conformité               |
| Bandeau projet expérimental | ✅ Ajouté et fixé                          | Info immédiate pour tout visiteur        |
| Déploiement GitHub Pages    | ✅ Configuré et testé                      | Site prêt à être partagé en version démo |
| Navigation et hash          | ⚡ Corrigé pour ouvrir directement #hero   | Accueil plus intuitif et user-friendly   |

---

## ✨ Conclusion

Jour 118 marque **une étape concrète pour la crédibilité et la diffusion** du projet :

* Les utilisateurs sont informés dès le premier regard.
* Le parcours reste fluide grâce au token.
* La landing page peut enfin être partagée en démo sur GitHub Pages.

> On continue à **renforcer la robustesse et la transparence** avant de montrer le projet à plus de monde.

💡 *Prochaine étape : finaliser la mise en ligne et tester le parcours complet depuis GitHub Pages.* 🌞
