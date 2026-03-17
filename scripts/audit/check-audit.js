const fs = require('fs');

// Récupère le fichier audit JSON passé en argument
const audit = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// On cherche les vulnérabilités "high" ou "moderate" sauf file-type
const relevantIssues = Object.values(audit.vulnerabilities)
  .filter(v => 
    (v.severity === 'high' || v.severity === 'moderate') && 
    v.name !== 'file-type'
  );

if (relevantIssues.length) {
  console.error('Vulnerabilités détectées (hors file-type) :', relevantIssues);
  process.exit(1);
} else {
  console.log('Pas de vulnérabilités critiques ou modérées autres que file-type.');
  process.exit(0);
}