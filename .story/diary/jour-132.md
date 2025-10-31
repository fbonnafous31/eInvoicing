# Jour 132 – Création et publication de l’eBook 📚💻

Aujourd’hui, l’objectif était de **mettre en forme tout le contenu accumulé dans le journal**, de générer un eBook complet et de le rendre **accessible en ligne**.

---

## 🛠 Préparation du contenu

J’ai commencé par **assembler tous les fichiers Markdown** du journal (`.story/diary`) :

* Chaque jour est trié dans l’ordre chronologique.
* Une page de garde a été ajoutée avec le titre, l’auteur et l’année.
* Des sauts de page (`\newpage`) sont insérés entre chaque jour pour que la lecture soit **fluide et structurée**.

> Cette étape est automatisée via un script Node (`generate-ebook.js`) qui assemble les fichiers et ajuste automatiquement les chemins des images.

---

## 🌟 Gestion des images

Pour que le PDF contienne **toutes les illustrations** :

* Les images sont centralisées dans `.story/images`.
* Les chemins dans les fichiers Markdown sont corrigés pour pointer vers ce dossier.
* Chaque image est insérée dans le PDF avec **un centrage et un retour à la ligne**, pour préserver la lisibilité et la mise en page.

> L’objectif est de **préserver l’expérience visuelle** tout en gardant un flux de génération simple et fiable.

---

## 🖥 Génération du PDF

Le Markdown est transformé en PDF avec **Pandoc et XeLaTeX** :

* Métadonnées intégrées (titre, auteur, date).
* Sommaire automatique via `--toc`.
* Sauts de page et mise en forme conservés pour un rendu professionnel.

> Grâce au script `generate-ebook.js`, cette opération est **réalisable en une seule commande**, même avec des dizaines de chapitres et de nombreuses images.

---

## 🚀 Publication en ligne

Une fois généré :

* L’eBook est hébergé sur un espace en ligne accessible via un **lien direct**.
* Les utilisateurs peuvent **télécharger ou consulter le PDF** sans installation préalable.
* L’infrastructure choisie permet de mettre à jour l’eBook facilement à chaque nouvelle édition.

---

## ✨ Bilan du jour

| Élément           | Avancée                          | Impact                                                        |
| ----------------- | -------------------------------- | ------------------------------------------------------------- |
| Contenu Markdown  | ✅ Tous les jours assemblés       | Base prête pour le PDF et l’édition                          |
| Images            | ✅ Centralisées et chemins corrigés | Le PDF inclut toutes les illustrations correctement          |
| PDF               | ✅ Généré avec Pandoc/XeLaTeX    | Lecture agréable et format professionnel                      |
| Publication       | ✅ PDF mis en ligne               | Accessible immédiatement aux utilisateurs et testeurs        |

---

## 💡 Conclusion

Jour 132 est consacré à **la formalisation et la diffusion** :

* On transforme un contenu quotidien en un produit tangible.
* La lecture est soignée, avec images et structure.
* L’eBook est disponible en ligne, prêt à être partagé ou mis à jour.

> **Mettre le contenu en valeur et le rendre accessible** avant tout. 🌱
