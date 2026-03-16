-- 004_backfill_invoice_type.sql

-- 1. Remplir les factures existantes
UPDATE invoices
SET invoice_type = 'standard'
WHERE invoice_type IS NULL;

-- 2. Sécuriser le schéma
ALTER TABLE invoices
ALTER COLUMN invoice_type SET NOT NULL;

-- 3. Ajouter un DEFAULT pour les nouvelles factures
ALTER TABLE invoices
ALTER COLUMN invoice_type SET DEFAULT 'standard';