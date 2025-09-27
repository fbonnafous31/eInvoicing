# 📝 Bilan eInvoicing – Semaine PDF/A3, CI/CD, monitoring & déploiement 🚀

Cette semaine a été **intense et pleine de découvertes**, avec des hauts, des bas et des petites victoires qui font vraiment plaisir à voir.

## PDF/A‑3 : presque parfait… mais pas encore 🕵️‍♂️📄

* Je suis passé de **14 à 3 erreurs** pour la conformité ISO 19005.
* Côté positif : mon PDF/A3 est **fonctionnel, bien formé et exploitable** pour les utilisateurs.
* Côté frustrant : même si tout est utilisable, il ne répond pas encore **à 100% à la norme ISO**.
* Le vrai challenge commence maintenant : corriger ces 3 dernières erreurs coûte de plus en plus cher en temps et nécessite de **plonger dans du développement bas niveau**, tout en conservant la simplicité et l’âme du projet.

> Sentiment mitigé : j’ai un PDF opérationnel, mais je reste en quête de conformité ISO.

---

## CI/CD : des mystères éclaircis 🛠️✨

* Je pensais que la mise en place de la CI et de la CD allait être un **vrai casse-tête**, moi qui n’avais jamais manipulé ça.
* En réalité, avec l’aide de l’IA, ce n’est **pas si compliqué**.
* Bonus fun : j’ai ajouté un **badge de couverture de code** dans le README. Maintenant, je vois en un coup d’œil l’état des tests et ça motive vraiment !
* Sentiment : **découverte rassurante et satisfaisante**, je maîtrise enfin la chaîne d’intégration et de déploiement.

---

## Monitoring : poser les fondations 📊👀

* Prometheus et Grafana : je n’y connaissais **rien du tout**, mais j’ai réussi à les **mettre en place rapidement avec un guidage intelligent**.
* Objectif atteint : **les fondations sont là**, les métriques de base remontent, et tout est accessible.
* La prochaine étape : choisir les bons indicateurs pour le projet et créer des dashboards vraiment pertinents.
* Sentiment : **curiosité éveillée**, prêt à explorer davantage quand ce sera nécessaire.

---

## Automatisation du déploiement : la grande aventure 🐳💥

* J’avais naïvement pensé : « déployer = mettre le code en prod ». Haha… la réalité est beaucoup plus corsée 😅

* Ce que j’ai découvert : **déployer correctement, automatiquement et reproductiblement**, c’est un vrai chantier !

  * Restaurer un dump SQL correctement
  * Gérer les **variables d’environnement** et la configuration dynamique du frontend
  * Résoudre les **problèmes de CORS** et de reverse proxy Nginx
  * Assurer que **les volumes Docker** contiennent les fichiers persistants (DB, uploads)
  * Authentification et sécurisation JWT
  * Et même certains bouts de code fonctionnels en dev à reprendre pour que ça marche en prod

* Sentiment : énorme **travail de fond**, mais **énorme satisfaction** d’être presque arrivé au bout ! 🎉

---

## ✅ Points clés et réflexions

* **PDF/A3** : fonctionnel mais pas encore ISO parfait → patience et minutie requises.
* **CI/CD et badges** : fun et rassurant, ça donne un vrai aperçu de la qualité du projet.
* **Monitoring** : posé, prêt à évoluer, fondations solides.
* **Déploiement** : un vrai passage au monde réel du DevOps, avec tout ce que ça implique.

> Sentiment général : **fier et motivé**. La semaine a été intense, j’ai appris énormément et je vois clairement que mon projet devient un **produit industrialisé et robuste**, presque prêt à tourner en production avec un vrai processus DevOps derrière.
