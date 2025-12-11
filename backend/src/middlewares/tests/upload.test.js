/* global describe, it, expect, beforeEach, jest */
const path = require("path");

// -------------------------
// 🔹 Mocks
// -------------------------

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 1024 * 100 })), // 100 Ko
  readFileSync: jest.fn(() => Buffer.from("%PDF-1.4")),
}));

jest.mock("multer", () => {
  const multerFn = jest.fn(() => "mocked-multer");
  multerFn.diskStorage = jest.fn((config) => config);
  multerFn.fields = jest.fn(() => (req, res, cb) => cb());
  return multerFn;
});

jest.mock("file-type", () => ({
  fromFile: jest.fn().mockResolvedValue({ mime: "application/pdf" }),
}));

jest.mock("child_process", () => ({
  execFile: jest.fn((cmd, args, opts, cb) => cb(null, "ok")),
}));

jest.mock("pdf-parse", () => jest.fn(() => Promise.resolve({ text: "PDF sample" })));

// -------------------------
// 🔹 Tests
// -------------------------
describe("upload middleware", () => {
  let fs;
  let multer;

  beforeEach(() => {
    jest.resetModules();
    fs = require("fs");
    multer = require("multer");

    fs.existsSync.mockReturnValue(false);
    require("../upload");
  });

  it("devrait créer le dossier s'il n'existe pas", () => {
    const tmpDir = path.join(__dirname, "../../uploads/tmp");
    const finalDir = path.join(__dirname, "../../uploads/invoices");

    expect(fs.existsSync).toHaveBeenCalledWith(tmpDir);
    expect(fs.existsSync).toHaveBeenCalledWith(finalDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(tmpDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(finalDir, { recursive: true });
  });

  it("devrait configurer multer avec diskStorage", () => {
    expect(multer.diskStorage).toHaveBeenCalled();

    const storageConfig = multer.diskStorage.mock.results[0].value;
    expect(typeof storageConfig.destination).toBe("function");
    expect(typeof storageConfig.filename).toBe("function");

    const destCb = jest.fn();
    storageConfig.destination({}, {}, destCb);
    expect(destCb).toHaveBeenCalledWith(null, path.join(__dirname, "../../uploads/tmp"));

    const fileCb = jest.fn();
    const fakeFile = { originalname: "facture.pdf" };
    storageConfig.filename({}, fakeFile, fileCb);
    const calledArg = fileCb.mock.calls[0][1];
    expect(calledArg).toMatch(/facture\.pdf$/);
  });

  it("exporte le middleware multer et secureUpload", () => {
    const { upload, secureUpload } = require("../upload");
    expect(upload).toBeDefined();
    expect(typeof secureUpload).toBe("function");
  });
});
