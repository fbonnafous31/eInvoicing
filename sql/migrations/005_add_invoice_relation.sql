-- Ajout de la référence métier vers la facture d'origine
ALTER TABLE invoicing.invoices
ADD COLUMN original_invoice_number bpchar(20) NULL;

-- Index pour les recherches (optionnel mais utile)
CREATE INDEX idx_invoices_original_invoice_number
ON invoicing.invoices(original_invoice_number);