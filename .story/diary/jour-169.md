# Jour 169 – Consolider ce que l’interface bloque déjà, mais au niveau “hack” 🛡️

Aujourd’hui, j’ai travaillé sur une partie un peu invisible mais essentielle du projet : la **sécurité deep‑backend**.  
L’interface empêche déjà tout un tas d’actions non autorisées (consulter des clients d’un autre utilisateur, créer une facture pour quelqu’un d’autre, manipuler les attachments…).  
Mais il restait une zone grise : *qu’arrive-t-il si quelqu’un essaie d’attaquer directement l’API, en contournant complètement l’IHM ?*

Spoiler : maintenant, il n’arrive plus rien. 😄

---

## Pourquoi ce travail ?

L’objectif était double :

1. **Sécuriser une couche plus basse**, celle que seule une personne mal intentionnée pourrait tenter d’exploiter (ID farfelus, JSON corrompu, fichiers d'un autre seller, etc.).  
2. En même temps, **solidifier le fonctionnement général de l’interface**, car une API fiable, prévisible et homogène simplifie tout : les retours d’erreur, la cohérence UX, la maintenance future.

Bref : déjà bien sécurisé côté UI → maintenant également blindé côté API.

---

## Ce que j’ai mis en place (backend bas niveau renforcé)

### 🔐 Validation stricte des IDs
Avant, l’interface envoyait toujours des IDs propres.  
Mais un attaquant peut envoyer :

- un ID d’un autre seller  
- un ID beaucoup trop long  
- un ID non numérique  
- un ID inexistant mais valide  

Maintenant :

- ID invalide → `400 Bad Request`  
- ID inexistant ou appartenant à un autre seller → `404 Not Found` neutre  
- pas de fuite d’information (on ne dit jamais “ce client existe mais pas chez toi”)

### 📦 Sécurisation des attachments des factures
Là aussi, l’IHM jouait déjà bien son rôle.  
Mais côté API :

- un attachment appartenant à un autre seller → `404`  
- JSON illisible → `400`  
- plusieurs fichiers “main” → `400`  
- fichier non listé dans la base → `404`

Tout est filtré *avant même* que la création de facture ne commence.

### 🧵 Logging renforcé
Chaque requête a maintenant :

- un `requestId` unique  
- un logger isolé  
- les infos strictement nécessaires (méthode, URL, status, seller_id)  
- **aucune fuite d’un tenant à un autre**

Si jamais un souci apparaît, on peut le tracer proprement sans exposer quoi que ce soit.

### 🧪 Tests en mode “attaque API”
J’ai simulé des cas que l’interface ne produit jamais :

- requêtes concurrentes à haute fréquence  
- IDs illégitimes ou volontairement cassés  
- JSON volontairement malformés  
- créations de facture en poussant des fichiers d’un autre user  

Résultat :  
✔️ aucune fuite  
✔️ aucun crash serveur  
✔️ réponses propres et cohérentes  
✔️ comportement identique quel que soit le chemin d’accès (UI ou attaque directe)

---

## Résultat final

L’interface empêchait déjà les mauvaises actions…  
…mais maintenant, même si quelqu’un attaque directement ton API :

- il ne voit rien qui ne lui appartient pas  
- il ne peut rien créer pour un autre seller  
- il ne peut pas faire planter PostgreSQL  
- il ne peut pas injecter d’attachments frauduleux  
- les erreurs sont toujours claires et propres  
- le backend reste stable même avec 30 requêtes simultanées

C’est de la sécurité **bas niveau**, celle qui vient compléter la sécurité “front” pour donner un ensemble cohérent, robuste et agréable à maintenir.

---

## Une journée très technique mais très satisfaisante 😄

Aujourd’hui, eInvoicing gagne une **vraie résilience backend** :  
même si l’UI est déjà solide, la base API est maintenant blindée contre tout ce qui ne passe *pas* par elle.

Une vraie étape vers un SaaS propre, fiable et multi‑tenant comme il faut.
