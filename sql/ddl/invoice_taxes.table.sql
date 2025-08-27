-- invoicing.invoice_taxes definition

-- Drop table

-- DROP TABLE invoicing.invoice_taxes;

CREATE TABLE invoicing.invoice_taxes (
	id serial4 NOT NULL, -- Identifiant unique de l’assiette
	invoice_id int4 NOT NULL, -- Référence vers la facture
	vat_rate numeric(5, 2) NOT NULL, -- Taux TVA
	base_amount numeric(14, 2) NOT NULL, -- Base HT (assiette)
	tax_amount numeric(14, 2) NOT NULL, -- Montant TVA
	CONSTRAINT invoice_taxes_invoice_id_vat_rate_key UNIQUE (invoice_id, vat_rate),
	CONSTRAINT invoice_taxes_pkey PRIMARY KEY (id)
);

-- Column comments

COMMENT ON COLUMN invoicing.invoice_taxes.id IS 'Identifiant unique de l’assiette';
COMMENT ON COLUMN invoicing.invoice_taxes.invoice_id IS 'Référence vers la facture';
COMMENT ON COLUMN invoicing.invoice_taxes.vat_rate IS 'Taux TVA';
COMMENT ON COLUMN invoicing.invoice_taxes.base_amount IS 'Base HT (assiette)';
COMMENT ON COLUMN invoicing.invoice_taxes.tax_amount IS 'Montant TVA';


-- invoicing.invoice_taxes foreign keys

ALTER TABLE invoicing.invoice_taxes ADD CONSTRAINT invoice_taxes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;