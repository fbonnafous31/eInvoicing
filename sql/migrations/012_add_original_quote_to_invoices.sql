-- migrations/012_add_original_quote_to_invoices.sql

ALTER TABLE invoices
ADD COLUMN original_quote_number VARCHAR(50);