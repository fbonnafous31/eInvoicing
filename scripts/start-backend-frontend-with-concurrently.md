# 📝 Fiche pratique : Démarrage des serveurs avec un seul script `concurrently`

## 🎯 Objectif

Lancer backend et frontend simultanément dans un seul terminal avec un script npm simple.

---

## 🚀 Pré-requis

- Node.js installé  
- Dans `/frontend/package.json`, un script `"dev"` qui démarre le frontend.

---

## 1️⃣ Installer `concurrently`

Depuis le dossier `/frontend`, installe `concurrently` :
npm install --save-dev concurrently


## 2️⃣ Ajouter ce script dans /frontend/package.json
Ouvre /frontend/package.json et dans la section "scripts", ajoute le script suivant :
{
  "scripts": {
    "start:all": "concurrently \"cd ../backend && node server.js\" \"npm run dev\""
  }
}

## 3️⃣ Utilisation
npm run start:all

## 4️⃣ Arrêt
Utilise Ctrl + C pour arrêter les deux serveurs en même temps.
