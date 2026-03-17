const fs = require('fs');
const audit = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const relevantIssues = Object.values(audit.vulnerabilities)
  .filter(v => (v.severity === 'high' || v.severity === 'critical'));

if (relevantIssues.length) {
  console.error('❌ VULNÉRABILITÉS CRITIQUES TROUVÉES :');
  relevantIssues.forEach(issue => {
    console.error(`- [${issue.severity.toUpperCase()}] ${issue.name}`);
  });
  process.exit(1);
} else {
  console.log('✅ Audit passé (Fichiers Moderate ignorés pour compatibilité CJS).');
  process.exit(0);
}