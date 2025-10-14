/* global describe, it, expect, beforeEach, jest */
const path = require("path");

// Mock de fs
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock de multer directement dans jest.mock
jest.mock("multer", () => {
  const multerFn = jest.fn(() => "mocked-multer");
  multerFn.diskStorage = jest.fn((config) => config); // retourne la config pour tester callbacks
  return multerFn;
});

describe("upload middleware", () => {
  let fs;
  let multer;
  let uploadPath;

  beforeEach(() => {
    jest.resetModules();
    fs = require("fs");
    multer = require("multer");

    fs.existsSync.mockReturnValue(false);
    uploadPath = path.join(__dirname, "../../uploads/invoices");

    require("../upload");
  });

  it("devrait créer le dossier s'il n'existe pas", () => {
    expect(fs.existsSync).toHaveBeenCalledWith(uploadPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(uploadPath, { recursive: true });
  });

  it("devrait configurer multer avec diskStorage", () => {
    expect(multer.diskStorage).toHaveBeenCalled();

    const storageConfig = multer.diskStorage.mock.results[0].value;
    expect(typeof storageConfig.destination).toBe("function");
    expect(typeof storageConfig.filename).toBe("function");

    const destCb = jest.fn();
    storageConfig.destination({}, {}, destCb);
    expect(destCb).toHaveBeenCalledWith(null, uploadPath);

    const fileCb = jest.fn();
    const fakeFile = { originalname: "facture.pdf" };
    storageConfig.filename({}, fakeFile, fileCb);
    const calledArg = fileCb.mock.calls[0][1];
    expect(calledArg).toMatch(/facture\.pdf$/);
  });

  it("exporte le middleware multer", () => {
    const upload = require("../upload");
    expect(upload).toBe("mocked-multer");
  });
});
