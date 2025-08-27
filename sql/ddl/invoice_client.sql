-- invoicing.invoice_client definition

-- Drop table

-- DROP TABLE invoicing.invoice_client;

CREATE TABLE invoicing.invoice_client (
	id serial4 NOT NULL,
	invoice_id int4 NOT NULL,
	legal_name varchar(255) NOT NULL, -- Raison sociale ou nom/prénom du client au moment de la facture
	legal_identifier_type varchar(50) NOT NULL, -- Type d'identifiant (SIRET, TVA intra, Nom)
	legal_identifier varchar(50) NOT NULL -- Identifiant du client (SIRET, TVA intra ou nom complet),
	address text NULL, -- Adresse du client
	city varchar(100) NULL, -- Ville du client
	postal_code varchar(20) NULL, -- Code postal du client
	country_code bpchar(2) NULL, -- Code pays ISO 3166-1 alpha-2
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT invoice_client_invoice_id_key UNIQUE (invoice_id),
	CONSTRAINT invoice_client_pkey PRIMARY KEY (id)
);

-- Column comments

COMMENT ON COLUMN invoicing.invoice_client.legal_name IS 'Raison sociale ou nom/prénom du client au moment de la facture';
COMMENT ON COLUMN invoicing.invoice_client.legal_identifier_type IS 'Type d''identifiant (SIRET, TVA intra, Nom)';
COMMENT ON COLUMN invoicing.invoice_client.legal_identifier IS 'Identifiant du client (SIRET, TVA intra ou nom complet)';
COMMENT ON COLUMN invoicing.invoice_client.address IS 'Adresse du client';
COMMENT ON COLUMN invoicing.invoice_client.city IS 'Ville du client';
COMMENT ON COLUMN invoicing.invoice_client.postal_code IS 'Code postal du client';
COMMENT ON COLUMN invoicing.invoice_client.country_code IS 'Code pays ISO 3166-1 alpha-2';

-- Table Triggers

create trigger invoice_client_sync_client before
insert
    on
    invoicing.invoice_client for each row execute function sync_client_from_invoice_client();


-- invoicing.invoice_client foreign keys

ALTER TABLE invoicing.invoice_client ADD CONSTRAINT invoice_client_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;