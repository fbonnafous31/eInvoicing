-- invoicing.sellers definition

-- Drop table

-- DROP TABLE invoicing.sellers;

CREATE TABLE invoicing.sellers (
	id serial4 NOT NULL, -- Identifiant unique interne du vendeur
	legal_name varchar(255) NOT NULL, -- Raison sociale
	legal_identifier varchar(50) NOT NULL, -- Identifiant légal (ex : SIRET, VAT ID)
	address text NOT NULL, -- Adresse complète
	city varchar(100) NOT NULL, -- Ville
	postal_code varchar(20) NOT NULL, -- Code postal
	country_code bpchar(2) DEFAULT 'FR'::bpchar NOT NULL, -- Code pays ISO 3166-1 alpha-2
	vat_number varchar(50) NULL, -- Numéro de TVA intracommunautaire
	registration_info text NULL, -- Informations d'enregistrement (ex: RCS, registre du commerce)
	share_capital numeric(14, 2) NULL -- Capital social,
	created_at timestamp DEFAULT now() NOT NULL, -- Date de création
	updated_at timestamp DEFAULT now() NOT NULL, -- Date de mise à jour
	contact_email varchar(255) NOT NULL, -- Adresse email de contact du vendeur (facturation, support)
	phone_number varchar(50) NULL, -- Numéro de téléphone du vendeur
	company_type varchar(50) DEFAULT 'MICRO'::character varying NOT NULL, -- Type de société : MICRO, EI, SAS, SARL, SA, etc.
	iban varchar(34) NULL,
	bic varchar(11) NULL,
	CONSTRAINT sellers_pkey PRIMARY KEY (id),
	CONSTRAINT siret_format_check CHECK ((((legal_identifier)::text ~ '^\d{14}$'::text) OR (country_code <> 'FR'::bpchar)))
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
COMMENT ON COLUMN invoicing.sellers.created_at IS 'Date de création';
COMMENT ON COLUMN invoicing.sellers.updated_at IS 'Date de mise à jour';
COMMENT ON COLUMN invoicing.sellers.contact_email IS 'Adresse email de contact du vendeur (facturation, support)';
COMMENT ON COLUMN invoicing.sellers.phone_number IS 'Numéro de téléphone du vendeur';
COMMENT ON COLUMN invoicing.sellers.company_type IS 'Type de société : MICRO, EI, SAS, SARL, SA, etc.';