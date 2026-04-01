ALTER TABLE invoicing.invoices
ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) DEFAULT 'standard';