// docs/ebook/generate-ebook.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const diaryDir = path.join(__dirname, '../../.story/diary');
const originalImagesDir = path.join(__dirname, '../../.story/images');
const localImagesDir = path.join(__dirname, 'images');

const outputMd = path.join(__dirname, 'ebook.md');
const outputPdf = path.join(__dirname, 'ebook.pdf');

const title = "100 jours pour construire une app à son rythme";
const author = "François";
const date = new Date().getFullYear();

function ensureLocalImages() {
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(originalImagesDir, localImagesDir);

  console.log(`🖼️  Images copiées récursivement dans ${localImagesDir}`);
}

/**
 * Assemble Markdown + fixe chemins images
 */
function assembleMarkdown() {
  const files = fs.readdirSync(diaryDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();

  const coverMd = `% ${title}\n% ${author}\n% ${date}\n\n`;

  const contents = files.map(f => {
    let md = fs.readFileSync(path.join(diaryDir, f), 'utf-8');

    // Convertit ../images/... → ./images/...
    md = md.replace(/\!\[([^\]]*)\]\(\.\.\/images\/([^\)]+)\)/g, (m, alt, filename) => {
      return `![${alt}](./images/${filename})`;
    });

    return md;
  }).join('\n\n\\newpage\n\n');

  fs.writeFileSync(outputMd, coverMd + '\n\\newpage\n\n' + contents);
  console.log(`✅ Markdown assemblé dans : ${outputMd}`);
}

/**
 * Génère PDF
 */
function generatePdf() {
  const cmd = `pandoc "${outputMd}" -o "${outputPdf}" --metadata title="${title}" --metadata author="${author}" --metadata date="${date}" --pdf-engine=xelatex --toc --toc-depth=2`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Erreur génération PDF :', stderr);
      return;
    }
    console.log(`🎉 PDF généré : ${outputPdf}`);
  });
}

ensureLocalImages();
assembleMarkdown();
generatePdf();
