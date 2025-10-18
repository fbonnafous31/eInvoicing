// src/utils/downloadFile.js
export async function downloadFile(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log(`✅ Fichier téléchargé : ${filename}`);
  } catch (err) {
    console.error(`❌ Erreur téléchargement fichier : ${err.message}`);
    throw err;
  }
}
