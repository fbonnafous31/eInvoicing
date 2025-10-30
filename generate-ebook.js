// generate-ebook.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const diaryDir = path.join(__dirname, '.story/diary');
const imagesDir = path.join(__dirname, '.story/images');
const outputMd = path.join(__dirname, 'ebook.md');
const outputPdf = path.join(__dirname, 'ebook.pdf');

const title = "100 jours pour construire une app à son rythme";
const author = "François";
const date = new Date().getFullYear();

/**
 * Assemble tous les fichiers Markdown et ajuste les chemins d'images
 */
function assembleMarkdown() {
  const files = fs.readdirSync(diaryDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();

  // Page de garde
  const coverMd = `% ${title}\n% ${author}\n% ${date}\n\n`;

  const contents = files.map(f => {
    let md = fs.readFileSync(path.join(diaryDir, f), 'utf-8');

    // Regex pour détecter les images Markdown ![Alt](chemin)
    // Remplace tous les chemins ../images/... par ./.story/images/...
    md = md.replace(/\!\[([^\]]*)\]\((\.\.\/images\/[^\)]+)\)/g, (match, alt, imgPath) => {
      // Normalise le chemin pour Pandoc
      const newPath = path.join('./.story/images', path.relative('../images', imgPath)).replace(/\\/g, '/');
      return `![${alt}](${newPath})`;
    });

    return md;
  }).join('\n\n\\newpage\n\n');

  const finalMd = coverMd + '\n\\newpage\n\n' + contents;

  fs.writeFileSync(outputMd, finalMd);
  console.log(`Markdown assemblé dans ${outputMd}`);
}

/**
 * Génère le PDF avec Pandoc
 */
function generatePdf() {
  const cmd = `pandoc "${outputMd}" -o "${outputPdf}" --metadata title="${title}" --metadata author="${author}" --metadata date="${date}" --pdf-engine=xelatex --toc --toc-depth=2`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Erreur lors de la génération PDF :', err);
      console.error(stderr);
      return;
    }
    console.log(`PDF généré avec succès : ${outputPdf}`);
  });
}

assembleMarkdown();
generatePdf();
