ALTER TABLE invoicing.invoices
ADD COLUMN invoice_type VARCHAR(20) DEFAULT 'standard';