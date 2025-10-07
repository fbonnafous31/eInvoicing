/* global describe, it, expect, beforeEach */

// backend/src/modules/invoices/__tests__/invoiceClient.service.test.js
const InvoiceClientService = require("../invoiceClient.service.js");
const InvoiceClientModel = require("../invoiceClient.model.js");

jest.mock("../invoiceClient.model.js");

describe("InvoiceClientService", () => {
  const mockInvoiceId = 42;
  const mockClient = { name: "ACME", address: "Paris" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("🟢 create appelle le model avec les bons arguments", async () => {
    InvoiceClientModel.create.mockResolvedValue({ id: 1, ...mockClient });

    const result = await InvoiceClientService.create(mockInvoiceId, mockClient);

    expect(InvoiceClientModel.create).toHaveBeenCalledWith(mockInvoiceId, mockClient);
    expect(result).toEqual({ id: 1, ...mockClient });
  });

  it("📄 getByInvoiceId appelle findByInvoiceId du model", async () => {
    InvoiceClientModel.findByInvoiceId.mockResolvedValue(mockClient);

    const result = await InvoiceClientService.getByInvoiceId(mockInvoiceId);

    expect(InvoiceClientModel.findByInvoiceId).toHaveBeenCalledWith(mockInvoiceId);
    expect(result).toEqual(mockClient);
  });

  it("✏️ update appelle update du model avec les bons paramètres", async () => {
    InvoiceClientModel.update.mockResolvedValue({ success: true });

    const result = await InvoiceClientService.update(mockInvoiceId, mockClient);

    expect(InvoiceClientModel.update).toHaveBeenCalledWith(mockInvoiceId, mockClient);
    expect(result).toEqual({ success: true });
  });

  it("🗑️ delete appelle delete du model", async () => {
    InvoiceClientModel.delete.mockResolvedValue({ deleted: true });

    const result = await InvoiceClientService.delete(mockInvoiceId);

    expect(InvoiceClientModel.delete).toHaveBeenCalledWith(mockInvoiceId);
    expect(result).toEqual({ deleted: true });
  });
});
