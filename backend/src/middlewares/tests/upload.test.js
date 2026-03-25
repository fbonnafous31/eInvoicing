/* global describe, it, expect, beforeEach, jest */
const path = require("path");

// -------------------------
// Mocks globaux (chargement du module)
// -------------------------

jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 200 * 1024 })),
  readFileSync: jest.fn(() => Buffer.from("%PDF-1.4")),
  unlink: jest.fn((p, cb) => cb(null)),
}));

jest.mock("multer", () => {
  const m = jest.fn(() => ({
    fields: jest.fn(() => (req, res, cb) => cb()),
  }));
  m.diskStorage = jest.fn((config) => config);
  return m;
});

jest.mock("file-type", () => ({
  fromFile: jest.fn().mockResolvedValue({ mime: "application/pdf" }),
}));

jest.mock("child_process", () => ({
  execFile: jest.fn((cmd, args, opts, cb) => cb(null, "ok")),
}));

jest.mock("pdf-parse", () =>
  jest.fn().mockResolvedValue({ text: "Contenu propre" })
);

// -------------------------
// Helper
// -------------------------

function runMiddleware(middleware, req, res) {
  return new Promise((resolve) => {
    const originalSend = res.send.bind(res);
    res.send = jest.fn((...args) => {
      originalSend(...args);
      resolve();
    });
    middleware(req, res, () => resolve());
  });
}

// -------------------------
// Tests
// -------------------------

describe("upload middleware — initialisation", () => {
  let fs, multer;

  beforeEach(() => {
    jest.resetModules();
    fs = require("fs");
    multer = require("multer");
    fs.existsSync.mockReturnValue(false);
    require("../upload");
  });

  it("crée les dossiers s'ils n'existent pas", () => {
    const tmpDir = path.join(__dirname, "../../uploads/tmp");
    const finalDir = path.join(__dirname, "../../uploads/invoices");

    expect(fs.existsSync).toHaveBeenCalledWith(tmpDir);
    expect(fs.existsSync).toHaveBeenCalledWith(finalDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(tmpDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(finalDir, { recursive: true });
  });

  it("configure multer avec diskStorage", () => {
    expect(multer.diskStorage).toHaveBeenCalled();

    const storageConfig = multer.diskStorage.mock.results[0].value;
    expect(typeof storageConfig.destination).toBe("function");
    expect(typeof storageConfig.filename).toBe("function");

    const destCb = jest.fn();
    storageConfig.destination({}, {}, destCb);
    expect(destCb).toHaveBeenCalledWith(
      null,
      path.join(__dirname, "../../uploads/tmp")
    );

    const fileCb = jest.fn();
    storageConfig.filename({}, { originalname: "facture test.pdf" }, fileCb);
    expect(fileCb.mock.calls[0][1]).toMatch(/facture_test\.pdf$/);
  });

  it("exporte upload, isPdfSafe, moveFile, secureUpload", () => {
    const mod = require("../upload");
    expect(mod.upload).toBeDefined();
    expect(typeof mod.isPdfSafe).toBe("function");
    expect(typeof mod.moveFile).toBe("function");
    expect(typeof mod.secureUpload).toBe("function");
  });
});

// -------------------------

describe("isPdfSafe", () => {
  beforeEach(() => jest.resetModules());

  it("retourne true si le contenu est propre", async () => {
    require("pdf-parse").mockResolvedValue({ text: "Facture sans script" });
    const { isPdfSafe } = require("../upload");
    expect(await isPdfSafe("/fake/file.pdf")).toBe(true);
  });

  it("retourne false si /JavaScript détecté", async () => {
    require("pdf-parse").mockResolvedValue({ text: "/JavaScript alert()" });
    const { isPdfSafe } = require("../upload");
    expect(await isPdfSafe("/fake/file.pdf")).toBe(false);
  });

  it("retourne false si /OpenAction détecté", async () => {
    require("pdf-parse").mockResolvedValue({ text: "/OpenAction /JS" });
    const { isPdfSafe } = require("../upload");
    expect(await isPdfSafe("/fake/file.pdf")).toBe(false);
  });

  it("retourne false si /AcroForm détecté", async () => {
    require("pdf-parse").mockResolvedValue({ text: "/AcroForm fields" });
    const { isPdfSafe } = require("../upload");
    expect(await isPdfSafe("/fake/file.pdf")).toBe(false);
  });
});

// -------------------------

describe("moveFile", () => {
  beforeEach(() => jest.resetModules());

  it("déplace le fichier et retourne le chemin final", () => {
    const fs = require("fs");
    const { moveFile } = require("../upload");

    const result = moveFile("/tmp/uploads/tmp/test.pdf");

    expect(fs.renameSync).toHaveBeenCalledWith(
      "/tmp/uploads/tmp/test.pdf",
      expect.stringContaining("test.pdf")
    );
    expect(result).toMatch(/test\.pdf$/);
  });
});

// -------------------------

describe("secureUpload", () => {
  let req, res;

  beforeEach(() => {
    req = { files: null, headers: {} };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
  });

  function setupMocks({ mime = "application/pdf", multerError = null, files = null, pdfText = "Contenu propre", statSize = 200 * 1024 } = {}) {
    jest.resetModules();

    jest.doMock("multer", () => {
      const m = jest.fn(() => ({
        fields: jest.fn(() => (req, res, cb) => {
          if (multerError) return cb(multerError);
          req.files = files;
          cb(null);
        }),
      }));
      m.diskStorage = jest.fn((c) => c);
      return m;
    });

    jest.doMock("fs", () => ({
      existsSync: jest.fn().mockReturnValue(true),
      mkdirSync: jest.fn(),
      renameSync: jest.fn(),
      readFileSync: jest.fn(() => Buffer.from("%PDF-1.4")),
      statSync: jest.fn(() => ({ size: statSize })),
      unlink: jest.fn((p, cb) => cb(null)),
    }));

    jest.doMock("file-type", () => ({
      fromFile: jest.fn().mockResolvedValue({ mime }),
    }));

    jest.doMock("child_process", () => ({
      execFile: jest.fn((cmd, args, opts, cb) => cb(null)),
    }));

    jest.doMock("pdf-parse", () =>
      jest.fn().mockResolvedValue({ text: pdfText })
    );

    return require("../upload").secureUpload;
  }

  it("retourne 400 si multer échoue (fichier trop lourd)", async () => {
    const secureUpload = setupMocks({ multerError: new Error("File too large") });
    const middleware = secureUpload([{ name: "file", maxCount: 1 }]);
    await runMiddleware(middleware, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Fichier(s) invalide(s) ou trop lourd(s)");
  });

  it("retourne 400 si aucun fichier reçu", async () => {
    const secureUpload = setupMocks({ files: null });
    const middleware = secureUpload([{ name: "file", maxCount: 1 }]);
    await runMiddleware(middleware, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Aucun fichier reçu");
  });

  it("retourne 400 si le MIME n'est pas application/pdf", async () => {
    const secureUpload = setupMocks({
      mime: "image/png",
      files: { file: [{ path: "/tmp/fake.pdf" }] },
    });
    const middleware = secureUpload([{ name: "file", maxCount: 1 }]);
    await runMiddleware(middleware, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Fichier(s) dangereux ou invalide(s)");
  });

  it("retourne 400 si le PDF contient du contenu actif", async () => {
    const secureUpload = setupMocks({
      files: { file: [{ path: "/tmp/fake.pdf" }] },
      pdfText: "/JavaScript alert()",
    });
    const middleware = secureUpload([{ name: "file", maxCount: 1 }]);
    await runMiddleware(middleware, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Fichier(s) dangereux ou invalide(s)");
  });

  it("appelle next() si toutes les validations passent", async () => {
    const secureUpload = setupMocks({
      files: { file: [{ path: "/tmp/fake.pdf" }] },
    });
    const next = jest.fn();
    const middleware = secureUpload([{ name: "file", maxCount: 1 }]);

    await new Promise((resolve) => {
      next.mockImplementation(resolve);
      middleware(req, res, next);
    });

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  }
);
});