# Jour #188 - Facture d’avoir : référence et Factur-X 📌

## Un type dédié pour les factures d’avoir 💳

Aujourd’hui, j’ai ajouté un **nouveau type dans le header** pour gérer les factures d’avoir :

```js
{ value: 'credit_note', label: 'Facture d’avoir' }
```

Cela permet de **différencier clairement** les avoirs des autres types de factures dans l’application.

---

## Saisie simple de la facture d’origine ✍️

Dans le header, l’utilisateur peut maintenant **saisir la référence de la facture originale**.
Pas de liste enrichie ici : juste une **saisie simple**, rapide et flexible.

---

## PDF et liste : on affiche le tag 💡

Pour que l’information soit visible partout :

* Dans le PDF, on indique clairement que c’est une **facture d’avoir**.
* Dans la liste des factures, on affiche un **tag coloré** :

```js
credit_note: {
  label: "Avoir",
  background: "#f8d7da",
  color: "#721c24",
}
```

Résultat : même en un coup d’œil, l’utilisateur sait qu’il s’agit d’un avoir.

---

## Factur-X : tout est prêt pour le XML 📄

Côté Factur-X, on gère correctement la référence et la date de la facture originale :

```js
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
```

Et pour l’`ExchangedDocument`, on ajuste le `TypeCode` et la date d’émission selon le type de facture :

```js
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
```

Tout est en place pour que **la facture d’avoir soit correctement référencée**, affichée, et exportable en Factur-X sans problème.

---

## Conclusion 🎯

Pas de révolution côté UX, mais un vrai **travail de cohérence et de fiabilité** :

* type dédié pour les factures d’avoir
* saisie simple de la référence de la facture originale
* affichage clair dans le PDF et dans la liste
* génération Factur-X valide et complète

Une petite amélioration qui fait toute la différence pour la gestion des avoirs ! 🚀
