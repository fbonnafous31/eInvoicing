// src/utils/downloadFile.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile } from './downloadFile';

describe('downloadFile', () => {
  let originalFetch;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalConsoleLog;
  let originalConsoleError;

  beforeEach(() => {
    // mocks globaux
    originalFetch = global.fetch;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalConsoleLog = console.log;
    originalConsoleError = console.error;

    global.fetch = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:url');
    URL.revokeObjectURL = vi.fn();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // restore
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  it('télécharge un fichier avec succès', async () => {
    const blob = new Blob(['test']);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(blob),
    });

    // créer un vrai <a> DOM
    const link = document.createElement('a');
    link.click = vi.fn();

    vi.spyOn(document, 'createElement').mockReturnValue(link);
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');

    await downloadFile('https://example.com/file.pdf', 'file.pdf');

    expect(fetch).toHaveBeenCalledWith('https://example.com/file.pdf');
    expect(link.download).toBe('file.pdf');
    expect(link.href).toBe('blob:url');
    expect(link.click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(removeChild).toHaveBeenCalledWith(link);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    expect(console.log).toHaveBeenCalledWith('✅ Fichier téléchargé : file.pdf');
  });

  it('lance une erreur si fetch échoue (res.ok=false)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(downloadFile('https://example.com/file.pdf', 'file.pdf'))
      .rejects.toThrow('Erreur serveur (500)');

    expect(console.error).toHaveBeenCalledWith(
      '❌ Erreur téléchargement fichier : Erreur serveur (500)'
    );
  });

  it('lance une erreur si fetch rejette', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network Error'));

    await expect(downloadFile('https://example.com/file.pdf', 'file.pdf'))
      .rejects.toThrow('Network Error');

    expect(console.error).toHaveBeenCalledWith(
      '❌ Erreur téléchargement fichier : Network Error'
    );
  });
});