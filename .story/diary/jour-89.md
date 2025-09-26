# 📝 Journal de bord eInvoicing – Déploiement & apprentissage DevOps

## Contexte général
Je travaille sur **eInvoicing**, une application web pour la gestion complète des factures : création, suivi, génération PDF et Factur-X, pièces jointes, clients, vendeurs, tout y est.  
Frontend en **React + Vite**, backend en **Node.js + Express**, base de données **PostgreSQL**.  
Objectif final : industrialiser le projet pour qu’il se déploie **n’importe où en un clic**, avec pipeline CI/CD, Docker et bonne hygiène DevOps.

## Ce que j’avais prévu
Je pensais passer une journée pour tout déployer et hop… magie, tout fonctionne.  
…Spoiler : la réalité est un peu plus complexe 😅

## Les surprises du déploiement
- Les **containers Docker** et volumes DB/upload demandent une attention particulière.  
- La **configuration Auth0/JWT** change entre dev et prod.  
- Les **variables d’environnement** doivent être parfaitement alignées selon le contexte.  
- Les **fichiers PDF, XML Factur-X et uploads** peuvent poser problème selon les chemins et permissions.  
- **CORS et accès réseau** : ce qui fonctionne en dev ne passe pas forcément en prod.  
- Même certains bouts de code corrects en dev peuvent **échouer en prod**.  

## Les apprentissages clés
- Découverte de l’**univers DevOps** : penser système, réseau et sécurité, pas juste logique métier.  
- Compréhension que **“ça marche sur mon poste”** est un vrai problème, et qu’il existe un **fossé réel entre dev et production**.  
- Travailler en solo comme dev et “Ops” permet d’**industrialiser un produit**, le rendre portable, robuste et reproductible.  
- Chaque galère est une leçon sur **cohérence des environnements et robustesse d’un produit**.

## Les moments magiques
- Après des heures de galère, voir mon projet **se lancer en quelques secondes n’importe où** est un vrai moment de satisfaction.  
- Le projet devient **un produit industrialisé**, prêt à être utilisé, déployé et maintenu.  
- Je vois désormais la **différence entre développement pur et production-ready**, et ça ouvre des perspectives sur la collaboration Dev/Ops dans des équipes plus grandes.

## Conclusion
Ce déploiement a pris beaucoup plus de temps que prévu, mais ce que j’ai appris dépasse largement le simple fait de mettre l’application en ligne.  
- Vision macro du système acquise.  
- Confiance dans le fait que le produit peut tourner **partout de manière fiable**.  
- Meilleure compréhension des enjeux humains et techniques du passage en production.  

C’est un vrai tournant dans mon parcours de développeur : je ne fais plus seulement du code, je construis **un produit solide, industrialisé et prêt pour le monde réel**.

---

### Notes de tips techniques
- Toujours **tester le pipeline CI/CD dans un environnement proche de la prod** avant déploiement officiel.  
- Vérifier les **volumes Docker** pour DB et uploads afin de ne pas perdre de données.  
- Confirmer que **toutes les variables d’environnement** sont bien injectées pour dev et prod.  
- Prévoir des **logs et monitoring** pour détecter les erreurs en prod.  
- Garder un **README clair et à jour** pour faciliter le passage à une équipe ou un autre serveur.  
