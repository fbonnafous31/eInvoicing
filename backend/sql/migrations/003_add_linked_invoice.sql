ALTER TABLE invoicing.invoices
ADD COLUMN linked_invoice_id INTEGER;

ALTER TABLE invoicing.invoices
ADD CONSTRAINT fk_linked_invoice
FOREIGN KEY (linked_invoice_id)
REFERENCES invoicing.invoices(id);