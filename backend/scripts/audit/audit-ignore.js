// audit-ignore.js
// 🔹 Ce fichier contient la liste des dépendances dont les vulnérabilités sont
//    connues mais non corrigibles dans notre projet CommonJS actuel.
// 🔹 Le script CI `check-audit.js` lira cette liste et ignorera ces vulnérabilités,
//    afin de ne pas bloquer la CI inutilement.
// 🔹 Important : documenter la raison et le plan de correction pour chaque paquet.

module.exports = {
  ignored: [
    // -------------------------
    // file-type
    // -------------------------
    // Connu : vulnérabilité "infinite loop in ASF parser on malformed input"
    // Source : https://github.com/advisories/GHSA-5v7r-6r5c-r473
    // Problème : cette vulnérabilité est corrigée uniquement dans file-type@21.3.3
    //            qui est ESM-only et incompatible avec notre projet CommonJS.
    // Plan de correction futur : migrer le projet en ESM et mettre à jour file-type
    "file-type",

    // -------------------------
    // fast-xml-parser
    // -------------------------
    // Connu : vulnérabilité "numeric entity expansion bypassing entity limits"
    // Source : https://github.com/advisories/GHSA-8gc5-j5rx-235r
    // Dépendance transitive via @aws-sdk/xml-builder
    // Problème : aucune version fixée compatible CommonJS pour le moment
    // Plan de correction futur : attendre une version compatible CJS corrigée ou migrer en ESM
    "fast-xml-parser",

    // -------------------------
    // @aws-sdk/xml-builder
    // -------------------------
    // Dépendance directe/transitive qui utilise fast-xml-parser
    // Vulnérabilité indirecte : héritée de fast-xml-parser
    // Problème : pas corrigible sans mise à jour du package parent
    // Plan de correction futur : mettre à jour le package AWS SDK quand une version safe est publiée
    "@aws-sdk/xml-builder",

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