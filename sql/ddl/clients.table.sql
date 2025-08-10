-- invoicing.clients definition

-- Drop table

-- DROP TABLE invoicing.clients;

CREATE TABLE invoicing.clients ( id serial4 NOT NULL, legal_name varchar(255) NOT NULL, legal_identifier varchar(50) NULL, address text NULL, city varchar(100) NULL, postal_code varchar(20) NULL, country_code bpchar(2) DEFAULT 'FR'::bpchar NULL, vat_number varchar(50) NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, CONSTRAINT clients_pkey PRIMARY KEY (id));

-- Column comments

COMMENT ON COLUMN invoicing.clients.id IS 'Identifiant unique interne du client';
COMMENT ON COLUMN invoicing.clients.legal_name IS 'Raison sociale';
COMMENT ON COLUMN invoicing.clients.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN invoicing.clients.address IS 'Adresse complète';
COMMENT ON COLUMN invoicing.clients.city IS 'Ville';
COMMENT ON COLUMN invoicing.clients.postal_code IS 'Code postal';
COMMENT ON COLUMN invoicing.clients.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN invoicing.clients.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN invoicing.clients.created_at IS 'Date de création';
COMMENT ON COLUMN invoicing.clients.updated_at IS 'Date de mise à jour';