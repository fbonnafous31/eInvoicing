const path = require("path");
const { generateStoredName, getFinalPath } = require("../fileNaming");

describe("fileNaming utils", () => {
  describe("generateStoredName", () => {
    const invoiceId = 123;
    const fileName = "mon fichier.pdf";

    it("devrait générer un nom avec le préfixe 'main' pour attachmentType 'main'", () => {
      const storedName = generateStoredName(invoiceId, "main", fileName);
      expect(storedName).toMatch(/^123_main_\d+_mon_fichier\.pdf$/);
    });

    it("devrait générer un nom avec le préfixe 'add' pour attachmentType différent de 'main'", () => {
      const storedName = generateStoredName(invoiceId, "additional", fileName);
      expect(storedName).toMatch(/^123_add_\d+_mon_fichier\.pdf$/);
    });

    it("devrait remplacer les espaces dans le nom de fichier par des underscores", () => {
      const storedName = generateStoredName(invoiceId, "main", "fichier test 123.pdf");
      expect(storedName).toMatch(/fichier_test_123\.pdf$/);
    });
  });

  describe("getFinalPath", () => {
    it("devrait renvoyer le chemin complet avec le nom de fichier fourni", () => {
      const storedName = "123_main_1690000000000_mon_fichier.pdf";
      const fullPath = getFinalPath(storedName);
      expect(fullPath).toContain(path.join("uploads", "invoices", storedName));
    });

    it("devrait renvoyer le chemin complet même si storedName est vide", () => {
      const fullPath = getFinalPath();
      expect(fullPath).toContain(path.join("uploads", "invoices"));
    });
  });
});
