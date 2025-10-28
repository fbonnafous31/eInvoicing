// backend/src/utils/__tests__/encryption.test.js

// ✅ Définir une clé pour les tests
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 caractères pour AES-256

const { encrypt, decrypt } = require('../encryption');

describe('encryption utils', () => {
  const originalText = 'HelloWorld123!';
  
  it('should encrypt text and return a non-empty string', () => {
    const encrypted = encrypt(originalText);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);
    expect(encrypted).not.toBe(originalText);
  });

  it('should decrypt encrypted text back to original', () => {
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should return null when encrypting null or undefined', () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
  });

  it('should return null when decrypting null or undefined', () => {
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
  });

  it('should throw an error if decrypting invalid format', () => {
    expect(() => decrypt('invalidciphertext')).toThrow();
  });

  it('should produce different ciphertexts for the same input (due to random IV)', () => {
    const encrypted1 = encrypt(originalText);
    const encrypted2 = encrypt(originalText);
    expect(encrypted1).not.toBe(encrypted2);
  });
});
