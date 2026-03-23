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
  const isCreditNote = header.invoice_type === 'credit_note';
  const isFinalInvoice = header.invoice_type === 'final';

  exchangedDoc
    .ele('ram:ID').txt(header.invoice_number.trim()).up()
    .ele('ram:TypeCode')
    .txt(isCreditNote ? '381' : (header.invoice_type === 'deposit' ? '380' : '380'))
    .up()
    .ele('ram:IssueDateTime')
      .ele('udt:DateTimeString', { format: '102' })
        .txt(header.issue_date.replace(/-/g, ''))
      .up()
    .up();

  // Mention légale auto-entrepreneur
  if (isAuto) {
    exchangedDoc
      .ele('ram:IncludedNote')
        .ele('ram:Content')
          .txt('Vendeur en franchise en base de TVA (article 293 B du CGI) — TVA non applicable')
        .up()
      .up();
  }

  // Mention facture d’acompte
  if (header.invoice_type === 'deposit') {
    exchangedDoc
      .ele('ram:IncludedNote')
        .ele('ram:Content')
          .txt('Facture d’acompte — montant partiel réglé')
        .up()
      .up();
  }

  // fermeture propre
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
          .ele('ram:ChargeAmount')
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
      .ele('ram:LineTotalAmount')
        .txt(parseFloat(line.line_net).toFixed(2))
      .up()
    .up();
  });

  // ApplicableHeaderTradeAgreement
  const agreement = transaction.ele('ram:ApplicableHeaderTradeAgreement');

  // SellerTradeParty
  const sellerIdentifier = resolveSellerIdentifier(seller);

  const sellerParty = agreement.ele('ram:SellerTradeParty');
  let schemeId = process.env.PDP_PROVIDER === 'iopole' ? '0009' : '0007';

  sellerParty.ele('ram:Name').txt(seller.legal_name).up();
  sellerParty.ele('ram:SpecifiedLegalOrganization')
      .ele('ram:ID', { schemeID: schemeId }).txt(sellerIdentifier).up()
    .up();
  sellerParty.ele('ram:PostalTradeAddress')
      .ele('ram:PostcodeCode').txt((seller.postal_code || '').trim()).up()
      .ele('ram:LineOne').txt(seller.address || '').up()
      .ele('ram:CityName').txt(seller.city || '').up()
      .ele('ram:CountryID').txt(seller.country_code || '').up()
    .up();

  if (seller.contact_email) {
    sellerParty.ele('ram:URIUniversalCommunication')
      .ele('ram:URIID', { schemeID: 'EM' })
      .txt(seller.contact_email.trim())
      .up()
    .up();
  }

  let vatNumber = seller.vat_number;
  let finalSchemeID;

  if (!vatNumber && isAuto) {
    // Auto-entrepreneur → numéro factice
    vatNumber = 'FRXX123456789';
    finalSchemeID = 'VA';
  } else if (vatNumber) {
    // Vendeur normal avec VAT
    finalSchemeID = 'VA'; 
  } else if (sellerIdentifier) {
    // Fallback si pas de VAT 
    vatNumber = sellerIdentifier;
    finalSchemeID = '0002';
  }

  // Génération XML si on a un numéro
  if (vatNumber) {
    sellerParty.ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: finalSchemeID })
        .txt(vatNumber)
        .up()
      .up();
  }

  // BuyerTradeParty
  const buyerParty = agreement.ele('ram:BuyerTradeParty');
  buyerParty.ele('ram:Name').txt(buyer.legal_name || 'Client').up();
  
  const buyerAddress = buyerParty.ele('ram:PostalTradeAddress');

  if (buyer.postal_code && buyer.postal_code.trim()) {
    buyerAddress.ele('ram:PostcodeCode').txt(buyer.postal_code.trim()).up();
  }
  if (buyer.address && buyer.address.trim()) {
    buyerAddress.ele('ram:LineOne').txt(buyer.address.trim()).up();
  }
  if (buyer.city && buyer.city.trim()) {
    buyerAddress.ele('ram:CityName').txt(buyer.city.trim()).up();
  }
  if (buyer.country_code && buyer.country_code.trim()) {
    buyerAddress.ele('ram:CountryID').txt(buyer.country_code.trim()).up();
  }
  
  buyerAddress.up();
  buyerParty.up();

  const delivery = transaction.ele('ram:ApplicableHeaderTradeDelivery');
  delivery.ele('ram:ActualDeliverySupplyChainEvent')
    .ele('ram:OccurrenceDateTime')
      .ele('udt:DateTimeString', { format: '102' })
        .txt(header.issue_date.replace(/-/g,'')) 
      .up()
    .up()
  .up();

  // ApplicableHeaderTradeSettlement
  const settlement = transaction.ele('ram:ApplicableHeaderTradeSettlement');
  settlement.ele('ram:InvoiceCurrencyCode').txt(currency).up();

  // Payment Means
  if (invoice.payee_iban || invoice.payer_iban) {

    const paymentMeans = settlement.ele('ram:SpecifiedTradeSettlementPaymentMeans');
    paymentMeans.ele('ram:TypeCode').txt('30').up();

    if (invoice.payer_iban) {
      paymentMeans
        .ele('ram:PayerPartyDebtorFinancialAccount')
          .ele('ram:IBANID')
            .txt(invoice.payer_iban)
          .up()
        .up();
    }

    if (invoice.payee_iban) {
      paymentMeans
        .ele('ram:PayeePartyCreditorFinancialAccount')
          .ele('ram:IBANID')
            .txt(invoice.payee_iban)
          .up()
        .up();
    }

  }

  // ApplicableTradeTax (TVA globale)
  if (taxes.length === 0) {
    const tradeTax = settlement.ele('ram:ApplicableTradeTax');
    tradeTax.ele('ram:CalculatedAmount').txt('0.00').up();
    tradeTax.ele('ram:TypeCode').txt('VAT').up();
    tradeTax.ele('ram:BasisAmount').txt(lineTotalAmount.toFixed(2)).up();
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
      tradeTax.ele('ram:CalculatedAmount').txt(tax.tax_amount).up();
      tradeTax.ele('ram:TypeCode').txt('VAT').up();
      tradeTax.ele('ram:BasisAmount').txt(tax.base_amount).up();
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
  const prepaidAmount = parseFloat(header.deposit_amount || 0); 
  const currentInvoiceTotal = grandTotalAmount; 
  
  // Le total de l'opération (1000 €)
  const operationTotal = currentInvoiceTotal + prepaidAmount; 

  const summation = settlement.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation');
  
  summation.ele('ram:LineTotalAmount').txt(lineTotalAmount.toFixed(2)).up()
      .ele('ram:TaxBasisTotalAmount').txt(lineTotalAmount.toFixed(2)).up()
      .ele('ram:TaxTotalAmount', { currencyID: currency }).txt(taxTotalAmount.toFixed(2)).up();

  // Ici, on affiche le total de l'opération complète (Acompte + Solde)
  summation.ele('ram:GrandTotalAmount').txt(operationTotal.toFixed(2)).up();

  if (prepaidAmount > 0) {
    // On indique ce qui a déjà été payé (600 €)
    summation.ele('ram:TotalPrepaidAmount').txt(prepaidAmount.toFixed(2)).up();
  }

  // Ce qu'il reste à payer aujourd'hui (400 €)
  summation.ele('ram:DuePayableAmount').txt(currentInvoiceTotal.toFixed(2)).up();
  
  summation.up();

  // Référence facture originale (obligatoire pour un avoir)
  const refNumber = header.original_invoice_number || invoice.reference_invoice_number;
  const refDate = header.original_invoice_date || invoice.reference_invoice_date;
  if (isCreditNote) {
    if (refNumber && refNumber.trim() !== '') {
      const invoiceRef = settlement.ele('ram:InvoiceReferencedDocument');
      invoiceRef.ele('ram:IssuerAssignedID').txt(refNumber.trim()).up();
      if (refDate) {
        invoiceRef.ele('ram:FormattedIssueDateTime')
          .ele('qdt:DateTimeString', { format: '102' })
          .txt(refDate.replace(/-/g, ''))
          .up()
        .up();
      }
    }
  }

  // InvoiceReferencedDocument
  if (isFinalInvoice && refNumber && refNumber.trim() !== '') {
    const invoiceRef = settlement.ele('ram:InvoiceReferencedDocument'); 

    invoiceRef.ele('ram:IssuerAssignedID').txt(refNumber.trim()).up();

    if (refDate) {
      invoiceRef.ele('ram:FormattedIssueDateTime')
        .ele('qdt:DateTimeString', { format: '102' }) 
          .txt(refDate.replace(/-/g, '')) 
        .up()
      .up();
    }
    
    invoiceRef.up(); 
  }

  // Receivable account (optionnel)
  if (invoice.buyer_account_ref) {
    settlement
      .ele('ram:ReceivableSpecifiedTradeAccountingAccount')
        .ele('ram:ID')
          .txt(invoice.buyer_account_ref)
        .up()
      .up();
  }

  return root.end({ prettyPrint: true });
}

function resolveSellerIdentifier(seller) {
  const provider = process.env.PDP_PROVIDER;
  const env = process.env.PDP_ENV;

  if (provider === "superpdp" && env === "sandbox") {
    return "000000002";
  }

  return seller.legal_identifier;
}

module.exports = { generateFacturXXML };
