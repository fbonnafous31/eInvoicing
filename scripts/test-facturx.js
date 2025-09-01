// facturx-generator.js
import { create } from 'xmlbuilder2';
import fs from 'fs';

// Exemple de données statiques
const invoiceData = {
  id: 'INV-2025-001',
  issueDate: '2025-09-01',
  seller: {
    name: 'Ma Société',
    street: '1 rue Exemple',
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
    siret: '12345678901234'
  },
  buyer: {
    name: 'Client',
    street: '2 rue Client',
    city: 'Paris',
    postalCode: '75002',
    country: 'FR'
  },
  lines: [
    { description: 'Produit A', quantity: 2, unitPrice: 50, vatRate: 20 },
    { description: 'Produit B', quantity: 1, unitPrice: 100, vatRate: 10 }
  ],
  currency: 'EUR'
};

function generateFacturXXML(invoice) {
  // --- 1. Calculer les totaux en premier ---
  let lineTotalAmount = 0;
  let taxTotalAmount = 0;
  const taxBreakdown = {};

  invoice.lines.forEach(line => {
    const lineAmount = line.quantity * line.unitPrice;
    const lineTaxAmount = lineAmount * (line.vatRate / 100);
    lineTotalAmount += lineAmount;
    taxTotalAmount += lineTaxAmount;

    if (!taxBreakdown[line.vatRate]) {
      taxBreakdown[line.vatRate] = { basis: 0, tax: 0 };
    }
    taxBreakdown[line.vatRate].basis += lineAmount;
    taxBreakdown[line.vatRate].tax += lineTaxAmount;
  });

  const grandTotalAmount = lineTotalAmount + taxTotalAmount;

  // --- 2. Construire le XML ---
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rsm:CrossIndustryInvoice', {
      'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
      'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
      'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100'
    })
    .ele('rsm:ExchangedDocumentContext')
      .ele('ram:GuidelineSpecifiedDocumentContextParameter')
        .ele('ram:ID').txt('urn:factur-x.eu:1p0:basic').up()
      .up()
    .up()
    .ele('rsm:ExchangedDocument') // Document Info
      .ele('ram:ID').txt(invoice.id).up()
      .ele('ram:TypeCode').txt('380').up() // 380 = Facture
      .ele('ram:IssueDateTime')
        .ele('udt:DateTimeString', { format: '102' }).txt(invoice.issueDate.replace(/-/g, '')).up()
      .up()
    .up()
    .ele('rsm:SupplyChainTradeTransaction'); // Racine pour la transaction

  // --- 3. Ajouter les lignes de facture (une par une) ---
  invoice.lines.forEach((line, index) => {
    const lineItem = root.ele('ram:IncludedSupplyChainTradeLineItem'); // Crée un nouvel élément pour chaque ligne
    lineItem.ele('ram:AssociatedDocumentLineDocument')
      .ele('ram:LineID').txt(index + 1).up()
    .up()
    .ele('ram:SpecifiedTradeProduct')
      .ele('ram:Name').txt(line.description).up()
    .up()
    .ele('ram:SpecifiedLineTradeAgreement')
      .ele('ram:NetPriceProductTradePrice') // Utiliser NetPrice est plus courant
        .ele('ram:ChargeAmount', { currencyID: invoice.currency }).txt(line.unitPrice.toFixed(2)).up()
      .up()
    .up()
    .ele('ram:SpecifiedLineTradeDelivery')
      .ele('ram:BilledQuantity', { unitCode: 'C62' }).txt(line.quantity).up()
    .up()
    .ele('ram:SpecifiedLineTradeSettlement')
      .ele('ram:ApplicableTradeTax')
        .ele('ram:TypeCode').txt('VAT').up()
        .ele('ram:CategoryCode').txt('S').up() // 'S' pour Taux standard
        .ele('ram:RateApplicablePercent').txt(line.vatRate).up()
      .up()
      .ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
        .ele('ram:LineTotalAmount', { currencyID: invoice.currency }).txt((line.quantity * line.unitPrice).toFixed(2)).up()
      .up()
    .up();
  });

  // --- 4. Ajouter les informations d'en-tête (vendeur, acheteur, totaux) ---
  root
      .ele('ram:ApplicableHeaderTradeAgreement')
        .ele('ram:SellerTradeParty')
          .ele('ram:Name').txt(invoice.seller.name).up()
          .ele('ram:PostalTradeAddress')
            .ele('ram:PostcodeCode').txt(invoice.seller.postalCode).up()
            .ele('ram:LineOne').txt(invoice.seller.street).up()
            .ele('ram:CityName').txt(invoice.seller.city).up()
            .ele('ram:CountryID').txt(invoice.seller.country).up()
          .up()
          .ele('ram:SpecifiedLegalOrganization')
            .ele('ram:ID', { schemeID: '0002' }).txt(invoice.seller.siret).up()
          .up()
        .up()
        .ele('ram:BuyerTradeParty')
          .ele('ram:Name').txt(invoice.buyer.name).up()
          .ele('ram:PostalTradeAddress')
            .ele('ram:PostcodeCode').txt(invoice.buyer.postalCode).up()
            .ele('ram:LineOne').txt(invoice.buyer.street).up()
            .ele('ram:CityName').txt(invoice.buyer.city).up()
            .ele('ram:CountryID').txt(invoice.buyer.country).up()
          .up()
        .up()
      .up()
      .ele('ram:ApplicableHeaderTradeSettlement')
        .ele('ram:InvoiceCurrencyCode').txt(invoice.currency).up()
        .ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
          .ele('ram:LineTotalAmount', { currencyID: invoice.currency }).txt(lineTotalAmount.toFixed(2)).up()
          .ele('ram:TaxBasisTotalAmount', { currencyID: invoice.currency }).txt(lineTotalAmount.toFixed(2)).up()
          .ele('ram:TaxTotalAmount', { currencyID: invoice.currency }).txt(taxTotalAmount.toFixed(2)).up()
          .ele('ram:GrandTotalAmount', { currencyID: invoice.currency }).txt(grandTotalAmount.toFixed(2)).up()
          .ele('ram:DuePayableAmount', { currencyID: invoice.currency }).txt(grandTotalAmount.toFixed(2)).up()
        .up()
      .up()

  return root.end({ prettyPrint: true });
}

// Générer le XML et l’écrire dans un fichier
const xml = generateFacturXXML(invoiceData);
fs.writeFileSync('facturx.xml', xml);
console.log('Factur-X XML généré avec succès !');
