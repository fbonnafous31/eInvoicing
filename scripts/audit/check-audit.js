const fs = require('fs');

const audit = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const highIssues = Object.values(audit.vulnerabilities)
  .filter(v => v.severity === 'high' && v.module_name !== 'file-type');

if (highIssues.length) {
  console.error('High severity issues detected:', highIssues);
  process.exit(1);
} else {
  console.log('No high severity issues except file-type.');
  process.exit(0);
}