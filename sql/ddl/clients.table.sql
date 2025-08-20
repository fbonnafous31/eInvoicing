-- invoicing.clients definition

-- Drop table

-- DROP TABLE invoicing.clients;

CREATE TABLE invoicing.clients (
	id serial4 NOT NULL, -- Identifiant unique interne du client
	legal_name varchar(255) NOT NULL, -- Raison sociale
	legal_identifier varchar(50) NULL, -- Identifiant légal (ex : SIRET, VAT ID)
	address text NULL, -- Adresse complète
	city varchar(100) NULL, -- Ville
	postal_code varchar(20) NULL, -- Code postal
	country_code bpchar(2) DEFAULT 'FR'::bpchar NULL, -- Code pays ISO 3166-1 alpha-2
	vat_number varchar(50) NULL, -- Numéro de TVA intracommunautaire
	created_at timestamp DEFAULT now() NULL, -- Date de création
	updated_at timestamp DEFAULT now() NULL, -- Date de mise à jour
	firstname varchar(100) NULL,
	lastname varchar(100) NULL,
	is_company bool DEFAULT true NOT NULL,
	siret varchar(14) NULL,
	email varchar(255) NULL,
	phone varchar(30) NULL,
	CONSTRAINT clients_company_person_required CHECK (((is_company AND (name IS NOT NULL)) OR ((NOT is_company) AND (firstname IS NOT NULL) AND (lastname IS NOT NULL)))),
	CONSTRAINT clients_country_iso2 CHECK ((country_code ~ '^[A-Z]{2}$'::text)),
	CONSTRAINT clients_pkey PRIMARY KEY (id),
	CONSTRAINT clients_siret_format_when_company CHECK ((((NOT is_company) AND (siret IS NULL)) OR (is_company AND (country_code = 'FR'::bpchar) AND ((siret)::text ~ '^[0-9]{14}$'::text)) OR (is_company AND (country_code <> 'FR'::bpchar) AND (siret IS NULL))))
);
CREATE UNIQUE INDEX clients_siret_unique_idx ON invoicing.clients USING btree (siret) WHERE (is_company AND (country_code = 'FR'::bpchar) AND (siret IS NOT NULL));

-- Column comments

COMMENT ON COLUMN invoicing.clients.id IS 'Identifiant unique interne du client';
COMMENT ON COLUMN invoicing.clients."name" IS 'Raison sociale';
COMMENT ON COLUMN invoicing.clients.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN invoicing.clients.address IS 'Adresse complète';
COMMENT ON COLUMN invoicing.clients.city IS 'Ville';
COMMENT ON COLUMN invoicing.clients.postal_code IS 'Code postal';
COMMENT ON COLUMN invoicing.clients.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN invoicing.clients.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN invoicing.clients.created_at IS 'Date de création';
COMMENT ON COLUMN invoicing.clients.updated_at IS 'Date de mise à jour';

-- Table Triggers

create trigger clients_set_updated_at before
update
    on
    invoicing.clients for each row execute function invoicing_set_updated_at();