# Jour 8 – La fiche détail : plonger dans les données d’un vendeur

Aujourd’hui, j’ai attaqué une partie essentielle de l’expérience utilisateur : **la fiche détail du vendeur**. Après avoir mis en place ma liste de vendeurs et la navigation vers chaque profil, il fallait offrir une vue complète de chaque entité et préparer le terrain pour les modifications et suppressions.

## Objectif
Afficher toutes les informations d’un vendeur dans un formulaire **non éditable par défaut**, avec la possibilité d’activer la modification ou la suppression via des boutons clairs.

## Structure de la fiche
J’ai choisi de réutiliser le composant **`SellerForm`** que j’avais créé pour les créations. Avantages :
- Formulaire déjà testé et fonctionnel.
- Gestion de l’état des champs facile.
- Cohérence visuelle avec l’écran de création.

Le formulaire reçoit maintenant :
- `initialData` pour pré-remplir les champs avec les informations du vendeur.
- `disabled` pour contrôler si le formulaire est éditable ou seulement consultable.

## Récupération des données
La fiche détail récupère le vendeur via une requête API (`fetch`) sur son `id`. Tant que les données ne sont pas chargées, un simple message **“Chargement…”** est affiché.  

```javascript
const [seller, setSeller] = useState(null);

useEffect(() => {
  fetch(`http://localhost:3000/api/sellers/${id}`)
    .then(res => res.json())
    .then(data => setSeller(data))
    .catch(console.error);
}, [id]);
```

## Les boutons
À la base, je voulais simplement afficher les informations. Mais pour préparer l’évolution de la fiche :

- **Modifier** : bascule le formulaire en mode édition.
- **Supprimer** : bouton rouge, pour l’instant inactif (alert temporaire).

Les deux boutons sont alignés **à droite**, pour un rendu clair et moderne.

```jsx
<div className="mt-3 d-flex justify-content-end gap-2">
  <button className="btn btn-primary">✏️ Modifier</button>
  <button className="btn btn-danger">Supprimer</button>
</div>
```

## Ce que j’ai appris
- Réutiliser un composant formulaire est **beaucoup plus efficace** que recréer toute la structure pour la consultation.
- Le pattern `initialData + disabled` est très pratique pour gérer **création / modification / consultation** avec un seul composant.
- Même pour de simples interactions comme un “alert”, mettre les boutons en place permet de **tester le layout et l’UX** avant de développer les fonctionnalités complètes.

## Prochaines étapes
- Activer le mode édition complet pour modifier les informations.
- Implémenter la suppression réelle avec confirmation.
- Eventuellement ajouter des validations supplémentaires

