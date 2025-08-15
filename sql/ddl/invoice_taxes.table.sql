-- invoicing.invoice_taxes definition

-- Drop table

-- DROP TABLE invoicing.invoice_taxes;

CREATE TABLE invoicing.invoice_taxes (
	id serial4 NOT NULL,
	invoice_id int4 NOT NULL,
	vat_rate numeric(5, 2) NOT NULL,
	base_amount numeric(14, 2) NOT NULL,
	tax_amount numeric(14, 2) NOT NULL,
	CONSTRAINT invoice_taxes_invoice_id_vat_rate_key UNIQUE (invoice_id, vat_rate),
	CONSTRAINT invoice_taxes_pkey PRIMARY KEY (id)
);


-- invoicing.invoice_taxes foreign keys

ALTER TABLE invoicing.invoice_taxes ADD CONSTRAINT invoice_taxes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;