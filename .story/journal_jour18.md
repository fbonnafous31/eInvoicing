# Jour 18 – Qualité des données et UX 📝✨

Aujourd’hui, j’ai concentré mes efforts sur la **qualité des données dans le formulaire de factures** et sur **l’expérience utilisateur**.  
L’objectif : permettre à l’utilisateur de **saisir correctement ses données dès le départ**, détecter les erreurs immédiatement et rendre l’interface intuitive.

---

## 🎯 Objectifs atteints

- Mise en place de **contrôles côté frontend** pour :  
  - Les champs obligatoires (`issue_date`, `fiscal_year`, `invoice_number`, justificatif principal)  
  - Les valeurs numériques (`quantity`, `unit_price`, `discount`, `vat_rate`)  
  - La cohérence des totaux et des assiettes de TVA  

- **Retour instantané** à l’utilisateur si une valeur est manquante ou incohérente, avant même d’envoyer les données au backend.  
- **Vérification complémentaire côté backend** pour garantir l’intégrité même si le frontend est contourné ou modifié.

---

## 💻 Côté frontend

### Validation immédiate
- L’utilisateur est alerté dès qu’un champ obligatoire n’est pas rempli.  
- Les totaux sont recalculés automatiquement et les assiettes de TVA mises à jour en temps réel.  
- Mise en avant visuelle des champs problématiques pour une correction rapide.

### Simplicité et clarté
- Les justificatifs principaux et additionnels sont facilement identifiables.  
- Les messages d’erreur sont précis et expliquent ce qu’il faut corriger.  
- UX pensée pour **limiter les erreurs et accélérer la saisie**.

---

## 🛠 Côté backend

- Contrôle des données critiques (`invoice_number`, `fiscal_year`, `attachments`) pour éviter toute incohérence dans la base.  
- Les transactions regroupent tous les éléments : lignes, TVA et justificatifs. Si un problème survient, **aucune donnée n’est partiellement enregistrée**.  
- Les erreurs remontent clairement au frontend pour informer l’utilisateur immédiatement.

---

## 🔍 Résultats et apprentissages

- L’expérience utilisateur est **plus fluide**, car les erreurs sont captées dès la saisie.  
- Les tests montrent que les problèmes de cohérence des données sont quasiment éliminés.  
- La combinaison **front + back** assure la robustesse : le frontend guide l’utilisateur, le backend garantit la sécurité.  
- Les assiettes de TVA sont automatiquement recalculées et affichées, permettant de détecter toute incohérence immédiatement.

---

## 🌿 Réflexions autour du produit

- Une **bonne UX et des validations claires** réduisent les erreurs et le stress de l’utilisateur.  
- La qualité des données commence dès la saisie, mais il est indispensable d’avoir un **contrôle backend** pour garantir l’intégrité.  
- Voir l’utilisateur saisir correctement ses informations et recevoir un feedback immédiat est extrêmement gratifiant.

---

## 🚀 Prochaines étapes

- Étendre les validations pour couvrir d’autres champs et cas particuliers.  
- Ajouter des **messages contextuels et des infobulles** pour guider encore mieux l’utilisateur.  
- Préparer le **prochain module** pour automatiser certaines suggestions de saisie et faciliter le workflow complet.

✅ Résultat : le formulaire devient **robuste, intuitif et sûr**, et la saisie des factures est rapide et fiable, même pour un utilisateur novice.
