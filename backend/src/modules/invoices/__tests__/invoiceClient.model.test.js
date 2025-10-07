/* global describe, it, expect, beforeEach */

const pool = require("../../../config/db.js");
const InvoiceClientModel = require("../invoiceClient.model.js");

jest.mock("../../../config/db.js");

describe("InvoiceClientModel", () => {
  const mockInvoiceId = 42;
  const mockData = {
    legal_name: "ACME",
    legal_identifier_type: "SIRET",
    legal_identifier: "12345678901234",
    address: "Rue Test",
    city: "Paris",
    postal_code: "75001",
    country_code: "FR",
    email: "test@acme.com",
    phone: "0102030405",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("🟢 create insère une nouvelle ligne et retourne le résultat", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, ...mockData }] });

    const result = await InvoiceClientModel.create(mockInvoiceId, mockData);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO[\s\S]*invoice_client/),
      [
        mockInvoiceId,
        mockData.legal_name,
        mockData.legal_identifier_type,
        mockData.legal_identifier,
        mockData.address,
        mockData.city,
        mockData.postal_code,
        mockData.country_code,
        mockData.email,
        mockData.phone,
      ]
    );
    expect(result).toEqual({ id: 1, ...mockData });
  });

  it("📄 findByInvoiceId récupère le client par invoiceId", async () => {
    pool.query.mockResolvedValue({ rows: [mockData] });

    const result = await InvoiceClientModel.findByInvoiceId(mockInvoiceId);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT \*[\s\S]*invoice_client/),
      [mockInvoiceId]
    );
    expect(result).toEqual(mockData);
  });

  it("✏️ update modifie le client et retourne le résultat", async () => {
    pool.query.mockResolvedValue({ rows: [mockData] });

    const result = await InvoiceClientModel.update(mockInvoiceId, mockData);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE[\s\S]*invoice_client/),
      [
        mockInvoiceId,
        mockData.legal_name,
        mockData.legal_identifier_type,
        mockData.legal_identifier,
        mockData.address,
        mockData.city,
        mockData.postal_code,
        mockData.country_code,
      ]
    );
    expect(result).toEqual(mockData);
  });

  it("🗑️ delete supprime le client et retourne true", async () => {
    pool.query.mockResolvedValue({});

    const result = await InvoiceClientModel.delete(mockInvoiceId);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE[\s\S]*invoice_client/),
      [mockInvoiceId]
    );
    expect(result).toBe(true);
  });
});
