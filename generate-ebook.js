// generate-ebook.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const diaryDir = path.join(__dirname, '.story/diary');
const outputMd = path.join(__dirname, 'ebook.md');
const outputPdf = path.join(__dirname, 'ebook.pdf');

const title = "100 jours pour construire une app à son rythme";
const author = "François";
const date = new Date().getFullYear();

function assembleMarkdown() {
  const files = fs.readdirSync(diaryDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();

  // Page de garde
  const coverMd = `% ${title}\n% ${author}\n% ${date}\n\n`;

  // Contenu avec saut de page entre chaque chapitre
  const contents = files
    .map(f => fs.readFileSync(path.join(diaryDir, f), 'utf-8'))
    .join('\n\n\\newpage\n\n');

  // Ajout d'un saut de page juste après la page de garde / TOC
  const finalMd = coverMd + '\n\\newpage\n\n' + contents;

  fs.writeFileSync(outputMd, finalMd);
  console.log(`Markdown assemblé dans ${outputMd}`);
}

function generatePdf() {
  const cmd = `pandoc "${outputMd}" -o "${outputPdf}" --metadata title="${title}" --metadata author="${author}" --metadata date="${date}" --pdf-engine=xelatex --toc --toc-depth=2`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Erreur lors de la génération PDF :', err);
      return;
    }
    console.log(`PDF généré avec succès : ${outputPdf}`);
  });
}

assembleMarkdown();
generatePdf();
