-- Resynchronisation des séquences

-- clients
SELECT setval(pg_get_serial_sequence('invoicing.clients','id'), COALESCE(MAX(id),0) + 1, false) FROM invoicing.clients;

-- sellers
SELECT setval(pg_get_serial_sequence('invoicing.sellers','id'), COALESCE(MAX(id),0) + 1, false) FROM invoicing.sellers;

-- invoices
SELECT setval(pg_get_serial_sequence('invoicing.invoices','id'), COALESCE(MAX(id),0) + 1, false) FROM invoicing.invoices;

-- invoice_lines
SELECT setval(pg_get_serial_sequence('invoicing.invoice_lines','id'), COALESCE(MAX(id),0) + 1, false) FROM invoicing.invoice_lines;

-- invoice_taxes
SELECT setval(pg_get_serial_sequence('invoicing.invoice_taxes','id'), COALESCE(MAX(id),0) + 1, false) FROM invoicing.invoice_taxes;

-- invoice_attachments
SELECT setval(pg_get_serial_sequence('invoicing.invoice_attachments','id'), COALESCE(MAX(id),0) + 1, false) FROM invoicing.invoice_attachments;
