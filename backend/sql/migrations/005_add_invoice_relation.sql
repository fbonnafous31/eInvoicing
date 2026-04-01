-- Ajout de la référence métier vers la facture d'origine
ALTER TABLE invoicing.invoices
ADD COLUMN IF NOT EXISTS original_invoice_number bpchar(20) NULL;

-- Index pour les recherches (optionnel mais utile)
CREATE INDEX IF NOT EXISTS idx_invoices_original_invoice_number
ON invoicing.invoices(original_invoice_number);