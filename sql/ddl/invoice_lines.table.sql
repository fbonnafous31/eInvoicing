-- invoicing.invoice_lines definition

-- Drop table

-- DROP TABLE invoicing.invoice_lines;

CREATE TABLE invoicing.invoice_lines ( id serial4 NOT NULL, invoice_id int4 NOT NULL, description text NOT NULL, quantity numeric(12, 2) NOT NULL, unit_price numeric(14, 2) NOT NULL, vat_rate numeric(5, 2) NOT NULL, discount numeric(14, 2) DEFAULT 0 NULL, line_net numeric(14, 2) NULL, line_tax numeric(14, 2) NULL, line_total numeric(14, 2) NULL, CONSTRAINT invoice_lines_pkey PRIMARY KEY (id));

-- Column comments

COMMENT ON COLUMN invoicing.invoice_lines.id IS 'Identifiant unique de la ligne';
COMMENT ON COLUMN invoicing.invoice_lines.invoice_id IS 'Référence vers la facture';
COMMENT ON COLUMN invoicing.invoice_lines.description IS 'Description de la ligne';
COMMENT ON COLUMN invoicing.invoice_lines.quantity IS 'Quantité';
COMMENT ON COLUMN invoicing.invoice_lines.unit_price IS 'Prix unitaire HT';
COMMENT ON COLUMN invoicing.invoice_lines.vat_rate IS 'Taux TVA en pourcentage';
COMMENT ON COLUMN invoicing.invoice_lines.discount IS 'Remise éventuelle';
COMMENT ON COLUMN invoicing.invoice_lines.line_net IS 'Montant HT après remise';
COMMENT ON COLUMN invoicing.invoice_lines.line_tax IS 'Montant TVA ligne';
COMMENT ON COLUMN invoicing.invoice_lines.line_total IS 'Montant TTC ligne';


-- invoicing.invoice_lines foreign keys

ALTER TABLE invoicing.invoice_lines ADD CONSTRAINT invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;