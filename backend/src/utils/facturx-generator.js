// backend/src/utils/facturx-generator.js
const { create } = require('xmlbuilder2');

function generateFacturXXML(invoice) {
  if (!invoice) throw new Error("invoice undefined");
  const header = invoice.header || {};
  const seller = invoice.seller || {};
  const buyer = invoice.client || {};
  const lines = Array.isArray(invoice.lines) ? invoice.lines : [];
  const taxes = Array.isArray(invoice.taxes) ? invoice.taxes : [];
  const currency = "EUR";

  // détecteur auto-entrepreneur : SELLER.company_type === 'AUTO'
  const isAuto = (typeof seller.company_type === 'string' && seller.company_type.toUpperCase() === 'AUTO');

  if (!header.invoice_number) {
    throw new Error(`Facture ${invoice.id || 'inconnue'} : invoice_number manquant`);
  }

  let lineTotalAmount = 0;
  lines.forEach(line => { lineTotalAmount += parseFloat(line.line_net || 0); });
  let taxTotalAmount = 0;
  taxes.forEach(tax => { taxTotalAmount += parseFloat(tax.tax_amount || 0); });
  const grandTotalAmount = lineTotalAmount + taxTotalAmount;

  // XML root
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rsm:CrossIndustryInvoice', {
      'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
      'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
      'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
      'xmlns:qdt': 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100'
    });

  // ExchangedDocumentContext
  root.ele('rsm:ExchangedDocumentContext')
      .ele('ram:GuidelineSpecifiedDocumentContextParameter')
        .ele('ram:ID')
          .txt('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic')
        .up()
      .up()
    .up();

  // ExchangedDocument
  const exchangedDoc = root.ele('rsm:ExchangedDocument');
  exchangedDoc
    .ele('ram:ID').txt(header.invoice_number.trim()).up()
    .ele('ram:TypeCode').txt('380').up()
    .ele('ram:IssueDateTime')
      .ele('udt:DateTimeString', { format: '102' })
        .txt(header.issue_date.replace(/-/g, ''))
      .up()
    .up();

  // Mention légale auto-entrepreneur (si applicable)
  if (isAuto) {
    exchangedDoc
      .ele('ram:IncludedNote')
        .ele('ram:Content')
          .txt('Vendeur en franchise en base de TVA (article 293 B du CGI) — TVA non applicable')
        .up()
      .up();
  }
  exchangedDoc.up();

  const transaction = root.ele('rsm:SupplyChainTradeTransaction');

  // SupplyChainTradeLineItems
  lines.forEach((line, index) => {
    const item = transaction.ele('ram:IncludedSupplyChainTradeLineItem');
    item.ele('ram:AssociatedDocumentLineDocument')
        .ele('ram:LineID').txt(index + 1).up()
      .up();
    item.ele('ram:SpecifiedTradeProduct')
        .ele('ram:Name').txt(line.description).up()
      .up();
    item.ele('ram:SpecifiedLineTradeAgreement')
        .ele('ram:NetPriceProductTradePrice')
          .ele('ram:ChargeAmount', { currencyID: currency })
            .txt(parseFloat(line.unit_price).toFixed(2))
          .up()
        .up()
      .up();
    item.ele('ram:SpecifiedLineTradeDelivery')
        .ele('ram:BilledQuantity', { unitCode: 'C62' })
          .txt(parseFloat(line.quantity).toFixed(2))
        .up()
      .up();

    // TVA par ligne
    const settlement = item.ele('ram:SpecifiedLineTradeSettlement');
    const tradeTax = settlement.ele('ram:ApplicableTradeTax');
    tradeTax.ele('ram:TypeCode').txt('VAT').up();
    tradeTax.ele('ram:CategoryCode').txt(isAuto ? 'Z' : 'S').up();
    tradeTax.ele('ram:RateApplicablePercent')
      .txt(isAuto ? '0.00' : (line.vat_rate || '20.00'))
    .up();

    settlement.ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
      .ele('ram:LineTotalAmount', { currencyID: currency })
        .txt(parseFloat(line.line_net).toFixed(2))
      .up()
    .up();
  });

  // ApplicableHeaderTradeAgreement
  const agreement = transaction.ele('ram:ApplicableHeaderTradeAgreement');

  // SellerTradeParty
  const sellerParty = agreement.ele('ram:SellerTradeParty');
  const schemeId = process.env.PDP_PROVIDER === 'iopole' ? '0009' : '0007';

  sellerParty.ele('ram:Name').txt(seller.legal_name).up();
  sellerParty.ele('ram:SpecifiedLegalOrganization')
      .ele('ram:ID', { schemeID: schemeId }).txt(seller.legal_identifier).up()
    .up();
  sellerParty.ele('ram:PostalTradeAddress')
      .ele('ram:PostcodeCode').txt((seller.postal_code || '').trim()).up()
      .ele('ram:LineOne').txt(seller.address || '').up()
      .ele('ram:CityName').txt(seller.city || '').up()
      .ele('ram:CountryID').txt(seller.country_code || '').up()
    .up();

  if (seller.vat_number) {
    sellerParty.ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: 'VA' }).txt(seller.vat_number).up()
      .up();
  } else if (seller.legal_identifier) {
    sellerParty.ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: '0002' }).txt(seller.legal_identifier).up()
      .up();
  }
  sellerParty.up();

  // BuyerTradeParty
  const buyerParty = agreement.ele('ram:BuyerTradeParty');
  buyerParty.ele('ram:Name').txt(buyer.legal_name).up();
  buyerParty.ele('ram:PostalTradeAddress')
      .ele('ram:PostcodeCode').txt(buyer.postal_code || '').up()
      .ele('ram:LineOne').txt(buyer.address || '').up()
      .ele('ram:CityName').txt(buyer.city || '').up()
      .ele('ram:CountryID').txt(buyer.country_code || '').up()
    .up();
  buyerParty.up();

  // ApplicableHeaderTradeDelivery (vide pour Basic)
  transaction.ele('ram:ApplicableHeaderTradeDelivery');

  // ApplicableHeaderTradeSettlement
  const settlement = transaction.ele('ram:ApplicableHeaderTradeSettlement');
  settlement.ele('ram:InvoiceCurrencyCode').txt(currency).up();

  // Payment Means
  const paymentMeans = settlement.ele('ram:SpecifiedTradeSettlementPaymentMeans');
  paymentMeans.ele('ram:TypeCode').txt('30').up();
  paymentMeans.ele('ram:PayerPartyDebtorFinancialAccount')
      .ele('ram:IBANID').txt(invoice.payer_iban || '').up().up();
  paymentMeans.ele('ram:PayeePartyCreditorFinancialAccount')
      .ele('ram:IBANID').txt(invoice.payee_iban || '').up().up();

  // ApplicableTradeTax (TVA globale)
  if (taxes.length === 0) {
    const tradeTax = settlement.ele('ram:ApplicableTradeTax');
    tradeTax.ele('ram:CalculatedAmount', { currencyID: currency }).txt('0.00').up();
    tradeTax.ele('ram:TypeCode').txt('VAT').up();
    tradeTax.ele('ram:BasisAmount', { currencyID: currency }).txt(lineTotalAmount.toFixed(2)).up();
    if (isAuto) {
      tradeTax.ele('ram:CategoryCode').txt('Z').up();
      tradeTax.ele('ram:RateApplicablePercent').txt('0.00').up();
    } else {
      tradeTax.ele('ram:CategoryCode').txt('S').up();
      tradeTax.ele('ram:RateApplicablePercent').txt('20.00').up();
    }
  } else {
    taxes.forEach(tax => {
      const tradeTax = settlement.ele('ram:ApplicableTradeTax');
      tradeTax.ele('ram:CalculatedAmount', { currencyID: currency }).txt(tax.tax_amount).up();
      tradeTax.ele('ram:TypeCode').txt('VAT').up();
      tradeTax.ele('ram:BasisAmount', { currencyID: currency }).txt(tax.base_amount).up();
      tradeTax.ele('ram:CategoryCode').txt(tax.category_code || 'S').up();
      tradeTax.ele('ram:RateApplicablePercent').txt(tax.vat_rate).up();
    });
  }

  // Payment terms
  const paymentTerms = settlement.ele('ram:SpecifiedTradePaymentTerms');
  paymentTerms.ele('ram:Description').txt('PAIEMENT 30 JOURS NET').up();
  const dueDate = invoice.payment_due_date
    ? invoice.payment_due_date.replace(/-/g, '')
    : (header.issue_date ? header.issue_date.replace(/-/g, '') : '');
  paymentTerms.ele('ram:DueDateDateTime')
      .ele('udt:DateTimeString', { format: '102' })
          .txt(dueDate)
      .up()
    .up();

  // Totaux
  settlement.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
      .ele('ram:LineTotalAmount', { currencyID: currency }).txt(lineTotalAmount.toFixed(2)).up()
      .ele('ram:TaxBasisTotalAmount', { currencyID: currency }).txt(lineTotalAmount.toFixed(2)).up()
      .ele('ram:TaxTotalAmount', { currencyID: currency }).txt(taxTotalAmount.toFixed(2)).up()
      .ele('ram:GrandTotalAmount', { currencyID: currency }).txt(grandTotalAmount.toFixed(2)).up()
      .ele('ram:DuePayableAmount', { currencyID: currency }).txt(grandTotalAmount.toFixed(2)).up()
    .up();

  // InvoiceReferencedDocument
  if (invoice.reference_invoice_number) {
    const invoiceRef = settlement.ele('ram:InvoiceReferencedDocument');
    invoiceRef.ele('ram:IssuerAssignedID').txt(invoice.reference_invoice_number).up();
    if (invoice.reference_invoice_date) {
      invoiceRef.ele('ram:FormattedIssueDateTime')
        .ele('qdt:DateTimeString', { format: '102' })
          .txt(invoice.reference_invoice_date.replace(/-/g, ''))
        .up()
      .up();
    }
  }

  // Receivable account (optionnel)
  settlement.ele('ram:ReceivableSpecifiedTradeAccountingAccount')
    .ele('ram:ID').txt(invoice.buyer_account_ref || '').up()
  .up();

  return root.end({ prettyPrint: true });
}

module.exports = { generateFacturXXML };
