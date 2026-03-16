const fs = require('fs');

const audit = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const highIssues = Object.entries(audit.vulnerabilities || {})
  .filter(([name, v]) => v.severity === 'high' && name !== 'file-type');

if (highIssues.length) {
  console.error('High severity issues detected (excluding file-type):', highIssues.map(([n,v]) => n));
  process.exit(1);
} else {
  console.log('No high severity issues except file-type.');
  process.exit(0);
}