/* global describe, it, expect, afterEach, jest */

const pool = require('../../../config/db');
const { decrypt } = require('../../../utils/encryption');

// Mock des fonctions d'encryption
jest.mock('../../../utils/encryption', () => ({
  encrypt: jest.fn((v) => `enc(${v})`),
  decrypt: jest.fn((v) => `dec(${v})`),
}));

jest.mock('../../../config/db');

const {
  getAllSellers,
  insertSeller,
  getSellerById,
  removeSeller,
  updateSeller,
} = require('../../../modules/sellers/sellers.model');

describe('sellers.model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // getAllSellers
  // -------------------------
  describe('getAllSellers', () => {
    it('retourne les rows', async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await getAllSellers();

      expect(pool.query).toHaveBeenCalled();
      expect(result).toEqual(mockRows);
    });

    it('retourne vide si aucune row', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getAllSellers();
      expect(result).toEqual([]);
    });

    it('propague les erreurs', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      await expect(getAllSellers()).rejects.toThrow('DB error');
    });
  });

  // -------------------------
  // insertSeller
  // -------------------------
  describe('insertSeller', () => {
    it('insère un vendeur avec SMTP', async () => {
      const mockClient = {
        query: jest.fn()
          // BEGIN
          .mockResolvedValueOnce({})
          // INSERT seller → retourne seller
          .mockResolvedValueOnce({ rows: [{ id: 1, legal_name: 'Société Test' }] })
          // INSERT SMTP
          .mockResolvedValueOnce({})
          // COMMIT
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };

      pool.connect.mockResolvedValue(mockClient);

      const sellerData = {
        legal_name: 'Société Test',
        legal_identifier: '123456',
        address: '1 rue Test',
        city: 'Paris',
        postal_code: '75000',
        country_code: 'FR',
        vat_number: 'FR123456',
        registration_info: 'Info',
        share_capital: '1000',
        iban: 'FR7630006000011234567890189',
        bic: 'AGRIFRPP',
        contact_email: 'test@test.com',
        phone_number: '0102030405',
        company_type: 'SARL',
        payment_method: 'Virement',
        payment_terms: '30j',
        additional_1: '',
        additional_2: '',
        smtp_host: 'smtp.test.com',
        smtp_user: 'user',
        smtp_pass: 'pass',
        smtp_from: 'from@test.com',
      };

      const result = await insertSeller(sellerData, 'auth0|123');

      expect(mockClient.query).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, legal_name: 'Société Test' });
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('insère un vendeur sans SMTP', async () => {
      const mockClient = {
        query: jest.fn()
          // BEGIN
          .mockResolvedValueOnce({})
          // INSERT seller
          .mockResolvedValueOnce({ rows: [{ id: 1, legal_name: 'Société Test' }] })
          // COMMIT
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };

      pool.connect.mockResolvedValue(mockClient);

      const sellerData = {
        legal_name: 'Société Test',
        legal_identifier: '12345',
        address: '123 rue Test',
        city: 'Paris',
        postal_code: '75001',
        country_code: 'FR',
        vat_number: 'FR12345',
        registration_info: 'RCS Paris 12345',
        share_capital: '1000',
        iban: 'FR7612345678901234567890123',
        bic: 'ABCDEF12',
        contact_email: 'test@example.com',
        phone_number: '0600000000',
        company_type: 'SARL',
        payment_method: 'virement',
        payment_terms: '30 jours',
      };

      const result = await insertSeller(sellerData, 'auth0|123');

      expect(result).toEqual({ id: 1, legal_name: 'Société Test' });
      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, INSERT, COMMIT
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // -------------------------
  // getSellerById
  // -------------------------
  describe('getSellerById', () => {
    it('retourne null si pas trouvé', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getSellerById(1);
      expect(result).toBeNull();
    });

    it('retourne seller avec smtp_pass vide si decrypt échoue', async () => {
      decrypt.mockImplementationOnce(() => { throw new Error('fail'); });
      pool.query.mockResolvedValue({ rows: [{ id: 1, smtp_pass: 'encrypted' }] });
      const result = await getSellerById(1);
      expect(result.smtp_pass).toBe('');
    });
  });

  // -------------------------
  // removeSeller
  // -------------------------
  describe('removeSeller', () => {
    it('supprime un seller existant', async () => {
      const mockClient = {
        query: jest.fn()
          // BEGIN
          .mockResolvedValueOnce({})
          // DELETE SMTP
          .mockResolvedValueOnce({})
          // DELETE seller
          .mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ id: 1, legal_name: 'Société Test' }]
          })
          // COMMIT
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };

      pool.connect.mockResolvedValue(mockClient);
      const result = await removeSeller(1);

      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(result).toEqual({ id: 1, legal_name: 'Société Test' });
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // -------------------------
  // updateSeller
  // -------------------------
  describe('updateSeller', () => {
    const mockData = {
      legal_name: 'Updated',
      legal_identifier: '123',
      address: 'addr',
      city: 'city',
      postal_code: '11111',
      country_code: 'FR',
      vat_number: 'FR123',
      registration_info: 'info',
      share_capital: '1000',
      phone_number: '123456789',
      contact_email: 'mail@mail.com',
      smtp_host: 'host',
      smtp_user: 'user',
      smtp_pass: 'pass',
      smtp_from: 'from@mail.com',
    };

    it('insère SMTP si aucune existante', async () => {
      const mockClient = {
        query: jest.fn()
          // SELECT SMTP existant → vide
          .mockResolvedValueOnce({ rows: [] })
          // UPDATE seller
          .mockResolvedValueOnce({ rows: [{ id: 1, legal_name: 'Updated' }] })
          // INSERT SMTP
          .mockResolvedValueOnce({ rows: [] }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      const result = await updateSeller(1, mockData);
      expect(result.legal_name).toBe('Updated');
    });

    it('lance une erreur si seller introuvable', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({ rows: [] }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      await expect(updateSeller(1, mockData)).rejects.toThrow();
    });
  });
});
