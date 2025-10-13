# Jour 111 – Déploiement automatisé & base propre ⚡🛠️

Aujourd’hui, je me suis attaqué à **tout ce qui touche au déploiement**, pour que mon projet devienne **facile à installer, propre et reproductible**. Fini les manipulations manuelles à rallonge : c’est maintenant quasi instantané.

---

## 🚀 Automatisation du déploiement

J’ai mis en place un **script `start-einvoicing.sh` ultra-robuste** :

* Vérifie que **Docker est installé**.
* Pull automatique des dernières **images frontend & backend**.
* Stoppe et supprime les conteneurs existants, et supprime le **volume DB** si nécessaire.
* Lancement des conteneurs dans le bon ordre (`db` → `backend` → `frontend`).
* Attente intelligente du **démarrage de PostgreSQL** avant de charger le dump.
* Copie automatique de la **config frontend** et reload de Nginx pour prendre en compte les variables runtime.

Maintenant, **une seule commande suffit** pour mettre en route une instance complète en local, en moins d’une minute 🕐.

---

## 💾 Base de données “clean”

Le dump SQL a été revu pour :

* Supprimer tous les **jeux de données tests** (clients, factures, etc.).
* Garder uniquement la **structure et les rôles nécessaires**.
* Assurer que l’**owner du schema** est générique (`francois` par défaut, mais facilement adaptable pour un client).
* Permettre un **re-déploiement rapide sans conflit**, même si la DB existe déjà.

Ça garantit qu’on part toujours sur **une base vierge**, prête à accueillir de vrais tests ou la production.

---

## 📚 Documentation & variables d’environnement

J’ai mis à jour la **doc `how-to-install.md`** pour que tout soit clair :

* Explication des variables `DB_HOST`, `DB_NAME`, `DB_USER` et `DB_PASSWORD`.
* Comment configurer le frontend (`config.js`) pour injecter les variables runtime.
* Précisions sur les ports exposés pour Docker et DBeaver.
* Checklist rapide pour vérifier que **la DB existe**, que les conteneurs tournent et que l’API répond.

Tout ça permet à n’importe qui de **lancer l'app sans rien oublier**.

---

## ⚠️ Difficultés & pièges évités

* Les conteneurs **déjà existants** pouvaient provoquer des conflits de nom → j’ai ajouté un nettoyage automatique (`docker rm -f` si nécessaire).
* Le pipe `| grep` dans le script bash posait problème en terminal interactif → je l’ai mis dans un script `.sh` pour éviter les erreurs `then dquote>`.
* PostgreSQL ne démarre pas instantanément → j’ai ajouté un **sleep et un check simple** pour que le dump ne plante pas.

Bref, j’ai anticipé **tous les petits oublis qui faisaient perdre du temps**.

---

## ✅ Conclusion

Aujourd’hui, j’ai fait un **énorme pas en avant côté productivité et reproductibilité** :

* Déploiement **rapide et fiable** en local.
* Base **propre et adaptable pour les clients**.
* Documentation et script qui **réduisent les erreurs humaines** au minimum.

Maintenant, chaque nouvel environnement peut être prêt en moins d’une minute, et je peux **me concentrer sur le développement fonctionnel** plutôt que sur la config.

C’est un vrai confort pour les jours à venir 🚀
