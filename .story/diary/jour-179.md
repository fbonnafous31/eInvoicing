# Jour 179 – Ce que m’a vraiment appris MCP 🧠

Hier, j’ai clos l’expérimentation.  
Aujourd’hui, je prends du recul.

Ce projet autour de MCP et des LLM n’était pas qu’un test technique.  
C’était un test d’architecture.  
Un test de maturité.  
Un test de responsabilité.

Et j’en ressors avec des convictions beaucoup plus claires.

---

## **Ce que j’ai appris sur MCP** 🔍

Sur le papier, l’idée était élégante : connecter un LLM à ma base de données pour interagir en langage naturel avec mon application.

Une couche intelligente.  
Moins d’interfaces rigides.  
Plus de fluidité.  
Plus de modernité.

Mais dans la réalité :

- Le LLM ne calcule pas, il prédit.
- Il n’est pas déterministe.
- Il ajoute de la latence.
- Il ajoute du coût.
- Il ajoute de la complexité.

MCP ne rendait pas mon système plus performant.  
Il le rendait plus sophistiqué.

**La sophistication n’est pas la valeur.**

---

## **Ce que j’ai appris sur les LLM dans mon app** 🤖

Les LLM sont impressionnants pour :

- Reformuler  
- Expliquer  
- Synthétiser  
- Générer du contenu clair et structuré  

Mais mon application repose sur :

- Des données structurées  
- Des règles précises  
- Des obligations réglementaires  
- De la traçabilité  

Un LLM intégré devient une couche narrative.  
Pas un moteur de calcul.  
Pas une source d’autorité juridique.  
Pas un garant de conformité.

La réponse peut être propre, cohérente, rassurante.  
Mais elle reste générique.

Et dans mon contexte, le générique peut devenir dangereux.

---

## **Là où j’ai bloqué** 🚧

### **Le déterminisme**

Mon système doit produire des résultats exacts.  
Traçables.  
Justifiables.

Un LLM peut :

- Se tromper  
- Simplifier à l’excès  
- Omettre une exception  
- Mélanger des cadres réglementaires  

Et il le fait avec assurance.

Dans un environnement réglementé, c’est un risque structurel.

---

### **Le contrôle**

Je n’ai pas :

- Le contrôle sur son entraînement  
- Le contrôle sur ses sources exactes  
- La garantie qu’il ne dérive pas  
- La capacité d’auditer son raisonnement interne  

Intégrer un LLM générique, c’est déléguer une partie de l’autorité métier à un système que je ne maîtrise pas entièrement.

Et ça, ça me dérange.

---

### **Les coûts**

- Coût financier des appels  
- Coût énergétique  
- Coût en latence  
- Coût en complexité d’architecture  
- Coût en maintenance  

Face à une requête SQL déterministe quasi instantanée, le ratio n’est pas défendable.

---

## **Les gains réels** 📊

Soyons honnête.

Les gains auraient été :

- Une interface plus conversationnelle  
- Un effet “wow”  
- Une aide pédagogique générique  
- Une image plus moderne  

Mais pas :

- Plus de précision  
- Plus de fiabilité  
- Plus de conformité  
- Plus de performance  

Le gain était cosmétique.  
Pas structurel.

---

## **Les risques** ⚖️

Dans mon contexte :

- Risque d’erreur réglementaire  
- Risque d’induire l’utilisateur en erreur  
- Risque de perte de crédibilité  
- Risque juridique indirect  
- Risque de dilution de responsabilité  

Le plus dangereux n’est pas l’erreur brute.

C’est la confiance que l’utilisateur accorde à l’application.

Un LLM intégré parle avec l’autorité du produit.  
Et cette autorité engage.

---

## **Ma conclusion** 🧭

Je n’ai pas échoué.

J’ai expérimenté.  
J’ai mesuré.  
J’ai comparé.  
J’ai décidé.

Dans mon cas :

- Pas de valeur structurelle suffisante  
- Des coûts réels  
- Des risques non négligeables  
- Une complexité inutile  

Donc je n’y vais pas.

Pas par rejet de l’IA.  
Pas par peur.  
Pas par conservatisme.

Mais par pragmatisme.

Mon système a besoin de :

- Déterminisme  
- Traçabilité  
- Fiabilité  
- Contrôle  

Aujourd’hui, un LLM générique connecté via MCP ne justifie pas le compromis.

Et savoir ne pas intégrer une technologie  
est parfois une décision d’architecture plus forte  
que savoir l’intégrer.
