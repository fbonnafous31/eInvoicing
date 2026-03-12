ALTER TABLE invoices
ADD COLUMN linked_invoice_id INTEGER;

ALTER TABLE invoices
ADD CONSTRAINT fk_linked_invoice
FOREIGN KEY (linked_invoice_id)
REFERENCES invoices(id);