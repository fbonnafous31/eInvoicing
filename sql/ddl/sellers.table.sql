-- invoicing.sellers definition

-- Drop table

-- DROP TABLE invoicing.sellers;

CREATE TABLE invoicing.sellers (
	id serial4 NOT NULL,
	legal_name varchar(255) NOT NULL,
	legal_identifier varchar(50) NOT NULL,
	address text NOT NULL,
	city varchar(100) NOT NULL,
	postal_code varchar(20) NOT NULL,
	country_code bpchar(2) DEFAULT 'FR'::bpchar NOT NULL,
	vat_number varchar(50) NULL,
	registration_info text NOT NULL,
	share_capital numeric(14, 2) NULL,
	bank_details text NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	contact_email varchar(255) NOT NULL,
	phone_number varchar(50) NULL,
	company_type varchar(50) DEFAULT 'MICRO'::character varying NOT NULL,
	CONSTRAINT sellers_pkey PRIMARY KEY (id)
);
-- Column comments

COMMENT ON COLUMN invoicing.sellers.id IS 'Identifiant unique interne du vendeur';
COMMENT ON COLUMN invoicing.sellers.legal_name IS 'Raison sociale';
COMMENT ON COLUMN invoicing.sellers.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN invoicing.sellers.address IS 'Adresse complète';
COMMENT ON COLUMN invoicing.sellers.city IS 'Ville';
COMMENT ON COLUMN invoicing.sellers.postal_code IS 'Code postal';
COMMENT ON COLUMN invoicing.sellers.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN invoicing.sellers.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN invoicing.sellers.registration_info IS 'Informations d''enregistrement (ex: RCS, registre du commerce)';
COMMENT ON COLUMN invoicing.sellers.share_capital IS 'Capital social';
COMMENT ON COLUMN invoicing.sellers.bank_details IS 'Détails bancaires (IBAN, BIC)';
COMMENT ON COLUMN invoicing.sellers.created_at IS 'Date de création';
COMMENT ON COLUMN invoicing.sellers.updated_at IS 'Date de mise à jour';

-- Constraints 
ALTER TABLE invoicing.sellers
ADD CONSTRAINT siret_format_check
CHECK (legal_identifier ~ '^\d{14}$' OR country_code <> 'FR');