const fs = require('fs');
const path = require('path');

// 🔹 Audit JSON passé en argument
const audit = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// 🔹 Charge la liste des vulnérabilités à ignorer depuis audit-ignore.js
//    Plus besoin de JSON.parse, on peut commenter directement le fichier JS
let ignored = [];
try {
  ignored = require(path.resolve(__dirname, 'audit-ignore.js')).ignored;
  if (!Array.isArray(ignored)) {
    console.warn('⚠️ La propriété ignored n’est pas un tableau dans audit-ignore.js');
    ignored = [];
  }
} catch (err) {
  console.warn('⚠️ Aucun fichier audit-ignore.js trouvé ou erreur de require, pas de vulnérabilités ignorées - error:', err.message);
}

// 🔹 Filtre les vulnérabilités critiques en excluant les ignorées
const relevantIssues = Object.values(audit.vulnerabilities)
  .filter(v =>
    (v.severity === 'high' || v.severity === 'critical') &&
    !ignored.includes(v.name)
  );

// 🔹 Si on trouve des vulnérabilités non ignorées, bloquer la CI
if (relevantIssues.length) {
  console.error('❌ VULNÉRABILITÉS CRITIQUES TROUVÉES :');
  relevantIssues.forEach(issue => {
    console.error(`- [${issue.severity.toUpperCase()}] ${issue.name}`);
    console.error(`  🔗 ${issue.via?.[0]?.url || 'Pas de lien'} `);
    console.error(`  📝 Comment corriger : vérifier la version fix disponible et mettre à jour si possible`);
  });
  process.exit(1);
} else {
  console.log('✅ Audit passé (vulns ignorées ou moderate ignorées pour compatibilité CJS).');
  console.log('💡 Pour corriger totalement, migrer en ESM et mettre à jour les paquets ignorés vers les versions fixées.');
  process.exit(0);
}