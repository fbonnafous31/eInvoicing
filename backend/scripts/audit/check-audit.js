const fs = require('fs');
const path = require('path');

// Audit JSON passé en argument
const audit = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Charge la liste des vulnérabilités à ignorer
const ignoreFile = path.resolve(__dirname, 'audit-ignore.json');
let ignored = [];
try {
  const ignoreJson = JSON.parse(fs.readFileSync(ignoreFile, 'utf8'));
  ignored = Array.isArray(ignoreJson.ignored) ? ignoreJson.ignored : [];
} catch (err) {
  console.warn('⚠️ Aucun fichier audit-ignore.json trouvé ou mal formé, pas de vulnérabilités ignorées - error:', err.message);
}

// Filtre les vulnérabilités critiques en excluant les ignorées
const relevantIssues = Object.values(audit.vulnerabilities)
  .filter(v =>
    (v.severity === 'high' || v.severity === 'critical') &&
    !ignored.includes(v.name)
  );

if (relevantIssues.length) {
  console.error('❌ VULNÉRABILITÉS CRITIQUES TROUVÉES :');
  relevantIssues.forEach(issue => {
    console.error(`- [${issue.severity.toUpperCase()}] ${issue.name}`);
  });
  process.exit(1);
} else {
  console.log('✅ Audit passé (Vulns ignorées ou moderate ignorées pour compatibilité CJS).');
  process.exit(0);
}