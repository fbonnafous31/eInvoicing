-- 010_add_invoice_sequence_number.sql

ALTER TABLE invoicing.invoices
ADD COLUMN invoice_sequence_number INT NULL;

COMMENT ON COLUMN invoices.invoice_sequence_number IS 'Numérotation continue interne pour les factures (non applicable aux devis)';

-- Commence à 1 et incrémente pour chaque facture existante (hors devis)
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id) AS seq
  FROM invoices
  WHERE invoice_type != 'quote'
)
UPDATE invoices i
SET invoice_sequence_number = o.seq
FROM ordered o
WHERE i.id = o.id;
