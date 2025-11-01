-- DROP SCHEMA invoicing;

CREATE SCHEMA preprod;

-- DROP SEQUENCE preprod.clients_id_seq;

CREATE SEQUENCE preprod.clients_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.invoice_attachments_id_seq;

CREATE SEQUENCE preprod.invoice_attachments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.invoice_client_id_seq;

CREATE SEQUENCE preprod.invoice_client_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.invoice_lines_id_seq;

CREATE SEQUENCE preprod.invoice_lines_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.invoice_status_id_seq;

CREATE SEQUENCE preprod.invoice_status_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.invoice_taxes_id_seq;

CREATE SEQUENCE preprod.invoice_taxes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.invoices_id_seq;

CREATE SEQUENCE preprod.invoices_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.seller_smtp_settings_id_seq;

CREATE SEQUENCE preprod.seller_smtp_settings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE preprod.sellers_id_seq;

CREATE SEQUENCE preprod.sellers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- preprod.sellers definition

-- Drop table

-- DROP TABLE preprod.sellers;

CREATE TABLE preprod.sellers (
	id serial4 NOT NULL, -- Identifiant unique interne du vendeur
	legal_name varchar(255) NOT NULL, -- Raison sociale
	legal_identifier varchar(50) NOT NULL, -- Identifiant légal (ex : SIRET, VAT ID)
	address text NOT NULL, -- Adresse complète
	city varchar(100) NOT NULL, -- Ville
	postal_code varchar(20) NOT NULL, -- Code postal
	country_code bpchar(2) DEFAULT 'FR'::bpchar NOT NULL, -- Code pays ISO 3166-1 alpha-2
	vat_number varchar(50) NULL, -- Numéro de TVA intracommunautaire
	registration_info text NULL, -- Informations d'enregistrement (ex: RCS, registre du commerce)
	share_capital numeric(14, 2) null, -- Capital social,
	created_at timestamp DEFAULT now() NOT NULL, -- Date de création
	updated_at timestamp DEFAULT now() NOT NULL, -- Date de mise à jour
	contact_email varchar(255) NOT NULL, -- Adresse email de contact du vendeur (facturation, support)
	phone_number varchar(50) NULL, -- Numéro de téléphone du vendeur
	company_type varchar(50) DEFAULT 'MICRO'::character varying NOT NULL, -- Type de société : MICRO, EI, SAS, SARL, SA, etc.
	iban varchar(34) NULL,
	bic varchar(11) NULL,
	payment_method varchar(100) NULL, -- Moyen de paiement du vendeur (ex: Virement, Chèque, Carte bancaire)
	payment_terms varchar(50) NULL, -- Conditions de paiement du vendeur (ex: À 30 jours, À réception)
	additional_1 text NULL, -- Mention complémentaire 1 à afficher sur les factures
	additional_2 text NULL, -- Mention complémentaire 2 à afficher sur les factures
	auth0_id varchar(255) NULL,
	plan varchar(20) DEFAULT 'essentiel'::character varying NOT NULL, -- Plan du vendeur : essentiel ou pro
	CONSTRAINT sellers_auth0_id_key UNIQUE (auth0_id),
	CONSTRAINT sellers_pkey PRIMARY KEY (id),
	CONSTRAINT siret_format_check CHECK ((((legal_identifier)::text ~ '^\d{14}$'::text) OR (country_code <> 'FR'::bpchar)))
);

-- Column comments

COMMENT ON COLUMN preprod.sellers.id IS 'Identifiant unique interne du vendeur';
COMMENT ON COLUMN preprod.sellers.legal_name IS 'Raison sociale';
COMMENT ON COLUMN preprod.sellers.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN preprod.sellers.address IS 'Adresse complète';
COMMENT ON COLUMN preprod.sellers.city IS 'Ville';
COMMENT ON COLUMN preprod.sellers.postal_code IS 'Code postal';
COMMENT ON COLUMN preprod.sellers.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN preprod.sellers.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN preprod.sellers.registration_info IS 'Informations d''enregistrement (ex: RCS, registre du commerce)';
COMMENT ON COLUMN preprod.sellers.share_capital IS 'Capital social';
COMMENT ON COLUMN preprod.sellers.created_at IS 'Date de création';
COMMENT ON COLUMN preprod.sellers.updated_at IS 'Date de mise à jour';
COMMENT ON COLUMN preprod.sellers.contact_email IS 'Adresse email de contact du vendeur (facturation, support)';
COMMENT ON COLUMN preprod.sellers.phone_number IS 'Numéro de téléphone du vendeur';
COMMENT ON COLUMN preprod.sellers.company_type IS 'Type de société : MICRO, EI, SAS, SARL, SA, etc.';
COMMENT ON COLUMN preprod.sellers.payment_method IS 'Moyen de paiement du vendeur (ex: Virement, Chèque, Carte bancaire)';
COMMENT ON COLUMN preprod.sellers.payment_terms IS 'Conditions de paiement du vendeur (ex: À 30 jours, À réception)';
COMMENT ON COLUMN preprod.sellers.additional_1 IS 'Mention complémentaire 1 à afficher sur les factures';
COMMENT ON COLUMN preprod.sellers.additional_2 IS 'Mention complémentaire 2 à afficher sur les factures';
COMMENT ON COLUMN preprod.sellers.plan IS 'Plan du vendeur : essentiel ou pro';


-- preprod.clients definition

-- Drop table

-- DROP TABLE preprod.clients;

CREATE TABLE preprod.clients (
	id serial4 NOT NULL, -- Identifiant unique interne du client
	legal_name varchar(255) NULL, -- Raison sociale
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
	seller_id int4 NOT NULL,
	CONSTRAINT clients_company_person_required CHECK (((is_company AND (legal_name IS NOT NULL)) OR ((NOT is_company) AND (firstname IS NOT NULL) AND (lastname IS NOT NULL)))),
	CONSTRAINT clients_country_iso2 CHECK ((country_code ~ '^[A-Z]{2}$'::text)),
	CONSTRAINT clients_pkey PRIMARY KEY (id),
	CONSTRAINT clients_siret_format_when_company CHECK ((((NOT is_company) AND (siret IS NULL)) OR (is_company AND (country_code = 'FR'::bpchar) AND ((siret)::text ~ '^[0-9]{14}$'::text)) OR (is_company AND (country_code <> 'FR'::bpchar) AND (siret IS NULL)))),
	CONSTRAINT clients_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES preprod.sellers(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX clients_siret_unique_idx ON preprod.clients USING btree (siret) WHERE (is_company AND (country_code = 'FR'::bpchar) AND (siret IS NOT NULL));
CREATE INDEX idx_clients_seller_id ON preprod.clients USING btree (seller_id);

-- Column comments

COMMENT ON COLUMN preprod.clients.id IS 'Identifiant unique interne du client';
COMMENT ON COLUMN preprod.clients.legal_name IS 'Raison sociale';
COMMENT ON COLUMN preprod.clients.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN preprod.clients.address IS 'Adresse complète';
COMMENT ON COLUMN preprod.clients.city IS 'Ville';
COMMENT ON COLUMN preprod.clients.postal_code IS 'Code postal';
COMMENT ON COLUMN preprod.clients.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN preprod.clients.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN preprod.clients.created_at IS 'Date de création';
COMMENT ON COLUMN preprod.clients.updated_at IS 'Date de mise à jour';


-- preprod.invoices definition

-- Drop table

-- DROP TABLE preprod.invoices;

CREATE TABLE preprod.invoices (
	id serial4 NOT NULL, -- Identifiant unique interne de la facture
	invoice_number bpchar(20) NOT NULL, -- Référence facture chez l’émetteur (max 20 caractères)
	issue_date date NOT NULL, -- Date d'émission de la facture
	supply_date date null, -- Date de livraison ou prestation,
	currency bpchar(3) DEFAULT 'EUR'::bpchar NULL, -- Devise ISO 4217
	contract_number varchar(100) NULL, -- Numéro de marché / contrat (engagement)
	purchase_order_number varchar(100) NULL, -- Numéro de commande (engagement)
	seller_id int4 NOT NULL, -- Référence vers le vendeur
	client_id int4 NULL, -- Référence vers l'acheteur
	seller_legal_name varchar(255) NOT null, -- Raison sociale du vendeur (dupliquée pour historique),
	subtotal numeric(14, 2) NULL, -- Montant HT total
	total_taxes numeric(14, 2) NULL, -- Montant total TVA
	total numeric(14, 2) NULL, -- Montant TTC total
	payment_terms text NULL, -- Conditions de paiement
	status varchar(20) DEFAULT 'draft'::character varying NULL, -- Statut (draft, final, canceled)
	created_at timestamp DEFAULT now() NULL, -- Date de création
	updated_at timestamp DEFAULT now() NULL, -- Date de mise à jour
	fiscal_year int4 NOT NULL, -- Année fiscale (année de l'émission de la facture)
	payment_method varchar(50) null, -- Moyen de paiement utilisé pour la facture,
	technical_status varchar(20) DEFAULT 'pending'::character varying NULL,
	submission_id varchar(50) NULL,
	last_technical_update timestamp DEFAULT now() NULL,
	business_status varchar(50) DEFAULT 'pending'::character varying NULL,
	CONSTRAINT chk_fiscal_year_range CHECK (((fiscal_year >= 2000) AND (fiscal_year <= 2100))),
	CONSTRAINT chk_fiscal_year_reasonable CHECK (((fiscal_year >= ((EXTRACT(year FROM issue_date))::integer - 1)) AND (fiscal_year <= ((EXTRACT(year FROM issue_date))::integer + 1)))),
	CONSTRAINT invoices_pkey PRIMARY KEY (id),
	CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES preprod.clients(id) ON DELETE SET NULL,
	CONSTRAINT invoices_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES preprod.sellers(id)
);
CREATE UNIQUE INDEX uniq_invoice_seller_year_number ON preprod.invoices USING btree (seller_id, fiscal_year, invoice_number);

-- Column comments

COMMENT ON COLUMN preprod.invoices.id IS 'Identifiant unique interne de la facture';
COMMENT ON COLUMN preprod.invoices.invoice_number IS 'Référence facture chez l’émetteur (max 20 caractères)';
COMMENT ON COLUMN preprod.invoices.issue_date IS 'Date d''émission de la facture';
COMMENT ON COLUMN preprod.invoices.supply_date IS 'Date de livraison ou prestation';
COMMENT ON COLUMN preprod.invoices.currency IS 'Devise ISO 4217';
COMMENT ON COLUMN preprod.invoices.contract_number IS 'Numéro de marché / contrat (engagement)';
COMMENT ON COLUMN preprod.invoices.purchase_order_number IS 'Numéro de commande (engagement)';
COMMENT ON COLUMN preprod.invoices.seller_id IS 'Référence vers le vendeur';
COMMENT ON COLUMN preprod.invoices.client_id IS 'Référence vers l''acheteur';
COMMENT ON COLUMN preprod.invoices.seller_legal_name IS 'Raison sociale du vendeur (dupliquée pour historique)';
COMMENT ON COLUMN preprod.invoices.subtotal IS 'Montant HT total';
COMMENT ON COLUMN preprod.invoices.total_taxes IS 'Montant total TVA';
COMMENT ON COLUMN preprod.invoices.total IS 'Montant TTC total';
COMMENT ON COLUMN preprod.invoices.payment_terms IS 'Conditions de paiement';
COMMENT ON COLUMN preprod.invoices.status IS 'Statut (draft, final, canceled)';
COMMENT ON COLUMN preprod.invoices.created_at IS 'Date de création';
COMMENT ON COLUMN preprod.invoices.updated_at IS 'Date de mise à jour';
COMMENT ON COLUMN preprod.invoices.fiscal_year IS 'Année fiscale (année de l''émission de la facture)';
COMMENT ON COLUMN preprod.invoices.payment_method IS 'Moyen de paiement utilisé pour la facture';

CREATE OR REPLACE FUNCTION preprod.prevent_delete_non_draft()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.status != 'draft' THEN
    RAISE EXCEPTION 'Impossible de supprimer une facture non brouillon';
  END IF;
  RETURN OLD;
END;
$function$
;

-- Table Triggers

create trigger prevent_delete_non_draft_trigger before
delete
    on
    preprod.invoices for each row execute function preprod.prevent_delete_non_draft();


-- preprod.seller_smtp_settings definition

-- Drop table

-- DROP TABLE preprod.seller_smtp_settings;

CREATE TABLE preprod.seller_smtp_settings (
	id serial4 NOT NULL,
	seller_id int4 NOT NULL, -- Référence vers le vendeur propriétaire de cette configuration.
	smtp_host varchar(255) NOT NULL, -- Nom d’hôte du serveur SMTP (ex : smtp.gmail.com).
	smtp_port int4 DEFAULT 587 NOT NULL, -- Port du serveur SMTP (généralement 465 ou 587).
	smtp_secure bool DEFAULT false NULL, -- Indique si la connexion utilise SSL/TLS.
	smtp_user varchar(255) NOT NULL, -- Nom d’utilisateur ou adresse e-mail utilisée pour l’authentification SMTP.
	smtp_pass varchar(255) NOT NULL, -- Mot de passe ou token d’application chiffré pour le compte SMTP.
	smtp_from varchar(255) NOT NULL, -- Adresse e-mail utilisée dans le champ From des messages envoyés.
	active bool DEFAULT true NULL, -- Indique si cette configuration SMTP est active.
	created_at timestamp DEFAULT now() NOT NULL, -- Date de création de la configuration SMTP.
	updated_at timestamp DEFAULT now() NOT NULL, -- Date de dernière mise à jour.
	CONSTRAINT seller_smtp_settings_pkey PRIMARY KEY (id),
	CONSTRAINT seller_smtp_settings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES preprod.sellers(id) ON DELETE CASCADE
);
COMMENT ON TABLE preprod.seller_smtp_settings IS 'Contient la configuration SMTP utilisée par chaque vendeur pour l’envoi de ses emails (factures, notifications, etc.).';

-- Column comments

COMMENT ON COLUMN preprod.seller_smtp_settings.seller_id IS 'Référence vers le vendeur propriétaire de cette configuration.';
COMMENT ON COLUMN preprod.seller_smtp_settings.smtp_host IS 'Nom d’hôte du serveur SMTP (ex : smtp.gmail.com).';
COMMENT ON COLUMN preprod.seller_smtp_settings.smtp_port IS 'Port du serveur SMTP (généralement 465 ou 587).';
COMMENT ON COLUMN preprod.seller_smtp_settings.smtp_secure IS 'Indique si la connexion utilise SSL/TLS.';
COMMENT ON COLUMN preprod.seller_smtp_settings.smtp_user IS 'Nom d’utilisateur ou adresse e-mail utilisée pour l’authentification SMTP.';
COMMENT ON COLUMN preprod.seller_smtp_settings.smtp_pass IS 'Mot de passe ou token d’application chiffré pour le compte SMTP.';
COMMENT ON COLUMN preprod.seller_smtp_settings.smtp_from IS 'Adresse e-mail utilisée dans le champ From des messages envoyés.';
COMMENT ON COLUMN preprod.seller_smtp_settings.active IS 'Indique si cette configuration SMTP est active.';
COMMENT ON COLUMN preprod.seller_smtp_settings.created_at IS 'Date de création de la configuration SMTP.';
COMMENT ON COLUMN preprod.seller_smtp_settings.updated_at IS 'Date de dernière mise à jour.';


-- preprod.invoice_attachments definition

-- Drop table

-- DROP TABLE preprod.invoice_attachments;

CREATE TABLE preprod.invoice_attachments (
	id serial4 NOT NULL,
	invoice_id int4 NOT NULL,
	file_name varchar(255) NOT NULL,
	file_path text NOT NULL,
	attachment_type text NOT NULL,
	uploaded_at timestamp DEFAULT now() NULL,
	stored_name varchar(255) NOT NULL,
	CONSTRAINT invoice_attachments_pkey PRIMARY KEY (id),
	CONSTRAINT invoice_attachments_type_check CHECK ((attachment_type = ANY (ARRAY[('main'::character varying)::text, ('additional'::character varying)::text]))),
	CONSTRAINT invoice_attachments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES preprod.invoices(id) ON DELETE CASCADE
);


-- preprod.invoice_client definition

-- Drop table

-- DROP TABLE preprod.invoice_client;

CREATE TABLE preprod.invoice_client (
	id serial4 NOT NULL,
	invoice_id int4 NOT NULL,
	legal_name varchar(255) NOT NULL, -- Raison sociale ou nom/prénom du client au moment de la facture
	legal_identifier_type varchar(50) NOT NULL, -- Type d'identifiant (SIRET, TVA intra, Nom)
	legal_identifier varchar(50) NOT null, -- Identifiant du client (SIRET, TVA intra ou nom complet),
	address text NULL, -- Adresse du client
	city varchar(100) NULL, -- Ville du client
	postal_code varchar(20) NULL, -- Code postal du client
	country_code bpchar(2) NULL, -- Code pays ISO 3166-1 alpha-2
	created_at timestamp DEFAULT now() NULL,
	email varchar(255) NULL,
	phone varchar(50) NULL,
	CONSTRAINT invoice_client_invoice_id_key UNIQUE (invoice_id),
	CONSTRAINT invoice_client_pkey PRIMARY KEY (id),
	CONSTRAINT invoice_client_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES preprod.invoices(id) ON DELETE CASCADE
);

-- Column comments

COMMENT ON COLUMN preprod.invoice_client.legal_name IS 'Raison sociale ou nom/prénom du client au moment de la facture';
COMMENT ON COLUMN preprod.invoice_client.legal_identifier_type IS 'Type d''identifiant (SIRET, TVA intra, Nom)';
COMMENT ON COLUMN preprod.invoice_client.legal_identifier IS 'Identifiant du client (SIRET, TVA intra ou nom complet)';
COMMENT ON COLUMN preprod.invoice_client.address IS 'Adresse du client';
COMMENT ON COLUMN preprod.invoice_client.city IS 'Ville du client';
COMMENT ON COLUMN preprod.invoice_client.postal_code IS 'Code postal du client';
COMMENT ON COLUMN preprod.invoice_client.country_code IS 'Code pays ISO 3166-1 alpha-2';

CREATE OR REPLACE FUNCTION preprod.upsert_client_from_invoice()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    existing_client_id INT;
BEGIN
    -- Cherche le client existant par SIRET si FR, ou par legal_identifier sinon
    IF NEW.legal_identifier_type = 'SIRET' THEN
        SELECT id INTO existing_client_id
        FROM preprod.clients
        WHERE siret = NEW.legal_identifier
          AND country_code = 'FR'
          AND is_company = TRUE;
    ELSE
        SELECT id INTO existing_client_id
        FROM preprod.clients
        WHERE (legal_name = NEW.legal_name OR
               (firstname || ' ' || lastname) = NEW.legal_name)
        LIMIT 1;
    END IF;

    IF existing_client_id IS NULL THEN
        -- Client n’existe pas → création
        INSERT INTO preprod.clients(
            legal_name,
            legal_identifier,
            siret,
            vat_number,
            address,
            city,
            postal_code,
            country_code,
            firstname,
            lastname,
            is_company,
            email,
            phone
        )
        VALUES (
            NEW.legal_name,
            NEW.legal_identifier,
            CASE WHEN NEW.legal_identifier_type = 'SIRET' THEN NEW.legal_identifier ELSE NULL END,
            CASE WHEN NEW.legal_identifier_type = 'VAT' THEN NEW.legal_identifier ELSE NULL END,
            NEW.address,
            NEW.city,
            NEW.postal_code,
            NEW.country_code,
            CASE WHEN NEW.legal_identifier_type = 'Nom' THEN split_part(NEW.legal_name, ' ', 1) ELSE NULL END,
            CASE WHEN NEW.legal_identifier_type = 'Nom' THEN split_part(NEW.legal_name, ' ', 2) ELSE NULL END,
            CASE WHEN NEW.legal_identifier_type = 'SIRET' OR NEW.legal_identifier_type = 'VAT' THEN TRUE ELSE FALSE END,
            NEW.email,
            NEW.phone
        )
        RETURNING id INTO existing_client_id;
    ELSE
        -- Client existe → mise à jour
        UPDATE preprod.clients
        SET
            legal_name = NEW.legal_name,
            siret = CASE WHEN NEW.legal_identifier_type = 'SIRET' THEN NEW.legal_identifier ELSE siret END,
            vat_number = CASE WHEN NEW.legal_identifier_type = 'VAT' THEN NEW.legal_identifier ELSE vat_number END,
            address = NEW.address,
            city = NEW.city,
            postal_code = NEW.postal_code,
            country_code = NEW.country_code,
            firstname = CASE WHEN NEW.legal_identifier_type = 'Nom' THEN split_part(NEW.legal_name, ' ', 1) ELSE firstname END,
            lastname = CASE WHEN NEW.legal_identifier_type = 'Nom' THEN split_part(NEW.legal_name, ' ', 2) ELSE lastname END,
            email = NEW.email,
            phone = NEW.phone,
            updated_at = now()
        WHERE id = existing_client_id;
    END IF;

    -- On ne modifie pas NEW.client_id ici

    RETURN NEW;
END;
$function$
;

create trigger invoice_client_sync_client_insert before
insert
    on
    preprod.invoice_client for each row execute function preprod.upsert_client_from_invoice();
create trigger invoice_client_sync_client_update before
update
    on
    preprod.invoice_client for each row execute function preprod.upsert_client_from_invoice();


-- preprod.invoice_lines definition

-- Drop table

-- DROP TABLE preprod.invoice_lines;

CREATE TABLE preprod.invoice_lines (
	id serial4 NOT NULL, -- Identifiant unique de la ligne
	invoice_id int4 NOT NULL, -- Référence vers la facture
	description text NOT NULL, -- Description de la ligne
	quantity numeric(12, 2) NOT NULL, -- Quantité
	unit_price numeric(14, 2) NOT NULL, -- Prix unitaire HT
	vat_rate numeric(5, 2) NOT NULL, -- Taux TVA en pourcentage
	discount numeric(14, 2) DEFAULT 0 NULL, -- Remise éventuelle
	line_net numeric(14, 2) NULL, -- Montant HT après remise
	line_tax numeric(14, 2) NULL, -- Montant TVA ligne
	line_total numeric(14, 2) NULL, -- Montant TTC ligne
	CONSTRAINT invoice_lines_pkey PRIMARY KEY (id),
	CONSTRAINT invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES preprod.invoices(id) ON DELETE CASCADE
);

-- Column comments

COMMENT ON COLUMN preprod.invoice_lines.id IS 'Identifiant unique de la ligne';
COMMENT ON COLUMN preprod.invoice_lines.invoice_id IS 'Référence vers la facture';
COMMENT ON COLUMN preprod.invoice_lines.description IS 'Description de la ligne';
COMMENT ON COLUMN preprod.invoice_lines.quantity IS 'Quantité';
COMMENT ON COLUMN preprod.invoice_lines.unit_price IS 'Prix unitaire HT';
COMMENT ON COLUMN preprod.invoice_lines.vat_rate IS 'Taux TVA en pourcentage';
COMMENT ON COLUMN preprod.invoice_lines.discount IS 'Remise éventuelle';
COMMENT ON COLUMN preprod.invoice_lines.line_net IS 'Montant HT après remise';
COMMENT ON COLUMN preprod.invoice_lines.line_tax IS 'Montant TVA ligne';
COMMENT ON COLUMN preprod.invoice_lines.line_total IS 'Montant TTC ligne';

CREATE OR REPLACE FUNCTION preprod.update_invoice_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Ne rien faire si la facture est finalisée
    IF (SELECT status FROM preprod.invoices WHERE id = NEW.invoice_id) != 'draft' THEN
        RETURN NEW;
    END IF;

    UPDATE preprod.invoices
    SET subtotal = COALESCE((SELECT SUM(line_net) FROM preprod.invoice_lines WHERE invoice_id = NEW.invoice_id), 0),
        total_taxes = COALESCE((SELECT SUM(line_tax) FROM preprod.invoice_lines WHERE invoice_id = NEW.invoice_id), 0),
        total = COALESCE((SELECT SUM(line_total) FROM preprod.invoice_lines WHERE invoice_id = NEW.invoice_id), 0),
        updated_at = NOW()
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$function$
;


-- Table Triggers

create trigger invoice_lines_totals_trigger after
insert
    or
update
    on
    preprod.invoice_lines for each row execute function preprod.update_invoice_totals();
create trigger invoice_lines_totals_trigger_delete after
delete
    on
    preprod.invoice_lines for each row execute function preprod.update_invoice_totals();


-- preprod.invoice_status definition

-- Drop table

-- DROP TABLE preprod.invoice_status;

CREATE TABLE preprod.invoice_status (
	id serial4 NOT NULL, -- Identifiant unique interne du statut
	invoice_id int4 NOT NULL, -- Référence vers la facture concernée
	status_code int4 NOT NULL, -- Code du statut remonté par le PDP (200, 201, ... )
	status_label varchar(100) NOT NULL, -- Libellé du statut correspondant
	created_at timestamp DEFAULT now() NOT NULL, -- Date et heure d’enregistrement du statut
	client_comment text NULL, -- Commentaire éventuel du client pour ce statut (refus, litige, approbation partielle)
	CONSTRAINT invoice_status_pkey PRIMARY KEY (id),
	CONSTRAINT invoice_status_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES preprod.invoices(id) ON DELETE CASCADE
);
CREATE INDEX idx_invoice_status_invoice_id ON preprod.invoice_status USING btree (invoice_id);
COMMENT ON TABLE preprod.invoice_status IS 'Historique des statuts liés au cycle de vie des factures (PDP)';

-- Column comments

COMMENT ON COLUMN preprod.invoice_status.id IS 'Identifiant unique interne du statut';
COMMENT ON COLUMN preprod.invoice_status.invoice_id IS 'Référence vers la facture concernée';
COMMENT ON COLUMN preprod.invoice_status.status_code IS 'Code du statut remonté par le PDP (200, 201, ... )';
COMMENT ON COLUMN preprod.invoice_status.status_label IS 'Libellé du statut correspondant';
COMMENT ON COLUMN preprod.invoice_status.created_at IS 'Date et heure d’enregistrement du statut';
COMMENT ON COLUMN preprod.invoice_status.client_comment IS 'Commentaire éventuel du client pour ce statut (refus, litige, approbation partielle)';


-- preprod.invoice_taxes definition

-- Drop table

-- DROP TABLE preprod.invoice_taxes;

CREATE TABLE preprod.invoice_taxes (
	id serial4 NOT NULL, -- Identifiant unique de l’assiette
	invoice_id int4 NOT NULL, -- Référence vers la facture
	vat_rate numeric(5, 2) NOT NULL, -- Taux TVA
	base_amount numeric(14, 2) NOT NULL, -- Base HT (assiette)
	tax_amount numeric(14, 2) NOT NULL, -- Montant TVA
	CONSTRAINT invoice_taxes_invoice_id_vat_rate_key UNIQUE (invoice_id, vat_rate),
	CONSTRAINT invoice_taxes_pkey PRIMARY KEY (id),
	CONSTRAINT invoice_taxes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES preprod.invoices(id) ON DELETE CASCADE
);

-- Column comments

COMMENT ON COLUMN preprod.invoice_taxes.id IS 'Identifiant unique de l’assiette';
COMMENT ON COLUMN preprod.invoice_taxes.invoice_id IS 'Référence vers la facture';
COMMENT ON COLUMN preprod.invoice_taxes.vat_rate IS 'Taux TVA';
COMMENT ON COLUMN preprod.invoice_taxes.base_amount IS 'Base HT (assiette)';
COMMENT ON COLUMN preprod.invoice_taxes.tax_amount IS 'Montant TVA';


-- DROP FUNCTION preprod.sync_client_from_invoice_client();

CREATE OR REPLACE FUNCTION preprod.sync_client_from_invoice_client()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    existing_client_id INT;
BEGIN
    -- Cas entreprise France (legal_identifier_type = 'SIRET')
    IF NEW.legal_identifier_type = 'SIRET' AND NEW.country_code = 'FR' THEN
        SELECT id INTO existing_client_id
        FROM preprod.clients
        WHERE siret = NEW.legal_identifier
        LIMIT 1;

        IF existing_client_id IS NULL THEN
            INSERT INTO preprod.clients (
                legal_name, siret, legal_identifier, address, city, postal_code, country_code, is_company, created_at, updated_at
            ) VALUES (
                NEW.legal_name, NEW.legal_identifier, NEW.legal_identifier, NEW.address, NEW.city, NEW.postal_code, NEW.country_code, TRUE, now(), now()
            )
            RETURNING id INTO existing_client_id;
        ELSE
            UPDATE preprod.clients
            SET legal_name = NEW.legal_name,
                address = NEW.address,
                city = NEW.city,
                postal_code = NEW.postal_code,
                updated_at = now()
            WHERE id = existing_client_id;
        END IF;

    -- Cas entreprise étrangère (VAT)
    ELSIF NEW.legal_identifier_type = 'VAT' AND NEW.country_code <> 'FR' THEN
        SELECT id INTO existing_client_id
        FROM preprod.clients
        WHERE vat_number = NEW.legal_identifier
        LIMIT 1;

        IF existing_client_id IS NULL THEN
            INSERT INTO preprod.clients (
                legal_name, vat_number, legal_identifier, address, city, postal_code, country_code, is_company, created_at, updated_at
            ) VALUES (
                NEW.legal_name, NEW.legal_identifier, NEW.legal_identifier, NEW.address, NEW.city, NEW.postal_code, NEW.country_code, TRUE, now(), now()
            )
            RETURNING id INTO existing_client_id;
        ELSE
            UPDATE preprod.clients
            SET legal_name = NEW.legal_name,
                address = NEW.address,
                city = NEW.city,
                postal_code = NEW.postal_code,
                updated_at = now()
            WHERE id = existing_client_id;
        END IF;

    -- Cas particulier (Nom complet)
    ELSIF NEW.legal_identifier_type = 'NAME' THEN
        SELECT id INTO existing_client_id
        FROM preprod.clients
        WHERE UPPER(firstname || ' ' || lastname) = UPPER(NEW.legal_identifier)
        LIMIT 1;

        IF existing_client_id IS NULL THEN
            INSERT INTO preprod.clients (
                firstname, lastname, legal_name, legal_identifier, address, city, postal_code, country_code, is_company, created_at, updated_at
            ) VALUES (
                split_part(NEW.legal_name, ' ', 1),          -- à adapter si firstname/lastname sont séparés
                split_part(NEW.legal_name, ' ', 2),          -- idem
                NEW.legal_name,
                NEW.legal_identifier,
                NEW.address, NEW.city, NEW.postal_code, NEW.country_code,
                FALSE, now(), now()
            )
            RETURNING id INTO existing_client_id;
        ELSE
            UPDATE preprod.clients
            SET legal_name = NEW.legal_name,
                address = NEW.address,
                city = NEW.city,
                postal_code = NEW.postal_code,
                updated_at = now()
            WHERE id = existing_client_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;