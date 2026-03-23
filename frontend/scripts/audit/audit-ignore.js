// audit-ignore.js
// 🔹 Ce fichier contient la liste des dépendances dont les vulnérabilités sont
//    connues mais non corrigibles dans notre projet CommonJS actuel.
// 🔹 Le script CI `check-audit.js` lira cette liste et ignorera ces vulnérabilités,
//    afin de ne pas bloquer la CI inutilement.
// 🔹 Important : documenter la raison et le plan de correction pour chaque paquet.

module.exports = {
  ignored: [
    // -------------------------
    // flatted
    // -------------------------
    // Connu : vulnérabilité "Prototype Pollution via parse() in NodeJS flatted"
    // Source : https://github.com/advisories/GHSA-rf6f-7fwh-wjgh
    // Dépendance transitive via flat-cache (utilisé par @typescript-eslint/eslint-plugin)
    // Problème : aucune version fixée compatible CommonJS pour le moment sans casser flat-cache
    // Plan de correction futur : mettre à jour flat-cache quand une version safe de flatted est supportée
    "flatted"
  ]
};