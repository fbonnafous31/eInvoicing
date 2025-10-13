--
-- PostgreSQL database dump
--

\restrict 5antdCQZXfcR9hAxneHGCQ5CtKVCqR5YjO56YIbuwI8jwxgxp742ATRgX8L1WL8

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: invoicing; Type: SCHEMA; Schema: -; Owner: francois
--

CREATE SCHEMA invoicing;


ALTER SCHEMA invoicing OWNER TO francois;

--
-- Name: prevent_delete_non_draft(); Type: FUNCTION; Schema: invoicing; Owner: francois
--

CREATE FUNCTION invoicing.prevent_delete_non_draft() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status != 'draft' THEN
    RAISE EXCEPTION 'Impossible de supprimer une facture non brouillon';
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION invoicing.prevent_delete_non_draft() OWNER TO francois;

--
-- Name: sync_client_from_invoice_client(); Type: FUNCTION; Schema: invoicing; Owner: francois
--

CREATE FUNCTION invoicing.sync_client_from_invoice_client() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    existing_client_id INT;
BEGIN
    -- Cas entreprise France (legal_identifier_type = 'SIRET')
    IF NEW.legal_identifier_type = 'SIRET' AND NEW.country_code = 'FR' THEN
        SELECT id INTO existing_client_id
        FROM invoicing.clients
        WHERE siret = NEW.legal_identifier
        LIMIT 1;

        IF existing_client_id IS NULL THEN
            INSERT INTO invoicing.clients (
                legal_name, siret, legal_identifier, address, city, postal_code, country_code, is_company, created_at, updated_at
            ) VALUES (
                NEW.legal_name, NEW.legal_identifier, NEW.legal_identifier, NEW.address, NEW.city, NEW.postal_code, NEW.country_code, TRUE, now(), now()
            )
            RETURNING id INTO existing_client_id;
        ELSE
            UPDATE invoicing.clients
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
        FROM invoicing.clients
        WHERE vat_number = NEW.legal_identifier
        LIMIT 1;

        IF existing_client_id IS NULL THEN
            INSERT INTO invoicing.clients (
                legal_name, vat_number, legal_identifier, address, city, postal_code, country_code, is_company, created_at, updated_at
            ) VALUES (
                NEW.legal_name, NEW.legal_identifier, NEW.legal_identifier, NEW.address, NEW.city, NEW.postal_code, NEW.country_code, TRUE, now(), now()
            )
            RETURNING id INTO existing_client_id;
        ELSE
            UPDATE invoicing.clients
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
        FROM invoicing.clients
        WHERE UPPER(firstname || ' ' || lastname) = UPPER(NEW.legal_identifier)
        LIMIT 1;

        IF existing_client_id IS NULL THEN
            INSERT INTO invoicing.clients (
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
            UPDATE invoicing.clients
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
$$;


ALTER FUNCTION invoicing.sync_client_from_invoice_client() OWNER TO francois;

--
-- Name: update_invoice_totals(); Type: FUNCTION; Schema: invoicing; Owner: francois
--

CREATE FUNCTION invoicing.update_invoice_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ne rien faire si la facture est finalisée
    IF (SELECT status FROM invoicing.invoices WHERE id = NEW.invoice_id) != 'draft' THEN
        RETURN NEW;
    END IF;

    UPDATE invoicing.invoices
    SET subtotal = COALESCE((SELECT SUM(line_net) FROM invoicing.invoice_lines WHERE invoice_id = NEW.invoice_id), 0),
        total_taxes = COALESCE((SELECT SUM(line_tax) FROM invoicing.invoice_lines WHERE invoice_id = NEW.invoice_id), 0),
        total = COALESCE((SELECT SUM(line_total) FROM invoicing.invoice_lines WHERE invoice_id = NEW.invoice_id), 0),
        updated_at = NOW()
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION invoicing.update_invoice_totals() OWNER TO francois;

--
-- Name: upsert_client_from_invoice(); Type: FUNCTION; Schema: invoicing; Owner: francois
--

CREATE FUNCTION invoicing.upsert_client_from_invoice() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    existing_client_id INT;
BEGIN
    -- Cherche le client existant par SIRET si FR, ou par legal_identifier sinon
    IF NEW.legal_identifier_type = 'SIRET' THEN
        SELECT id INTO existing_client_id
        FROM invoicing.clients
        WHERE siret = NEW.legal_identifier
          AND country_code = 'FR'
          AND is_company = TRUE;
    ELSE
        SELECT id INTO existing_client_id
        FROM invoicing.clients
        WHERE (legal_name = NEW.legal_name OR
               (firstname || ' ' || lastname) = NEW.legal_name)
        LIMIT 1;
    END IF;

    IF existing_client_id IS NULL THEN
        -- Client n’existe pas → création
        INSERT INTO invoicing.clients(
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
        UPDATE invoicing.clients
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
$$;


ALTER FUNCTION invoicing.upsert_client_from_invoice() OWNER TO francois;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.clients (
    id integer NOT NULL,
    legal_name character varying(255),
    legal_identifier character varying(50),
    address text,
    city character varying(100),
    postal_code character varying(20),
    country_code character(2) DEFAULT 'FR'::bpchar,
    vat_number character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    firstname character varying(100),
    lastname character varying(100),
    is_company boolean DEFAULT true NOT NULL,
    siret character varying(14),
    email character varying(255),
    phone character varying(30),
    seller_id integer NOT NULL,
    CONSTRAINT clients_company_person_required CHECK (((is_company AND (legal_name IS NOT NULL)) OR ((NOT is_company) AND (firstname IS NOT NULL) AND (lastname IS NOT NULL)))),
    CONSTRAINT clients_country_iso2 CHECK ((country_code ~ '^[A-Z]{2}$'::text)),
    CONSTRAINT clients_siret_format_when_company CHECK ((((NOT is_company) AND (siret IS NULL)) OR (is_company AND (country_code = 'FR'::bpchar) AND ((siret)::text ~ '^[0-9]{14}$'::text)) OR (is_company AND (country_code <> 'FR'::bpchar) AND (siret IS NULL))))
);


ALTER TABLE invoicing.clients OWNER TO francois;

--
-- Name: COLUMN clients.id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.id IS 'Identifiant unique interne du client';


--
-- Name: COLUMN clients.legal_name; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.legal_name IS 'Raison sociale';


--
-- Name: COLUMN clients.legal_identifier; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';


--
-- Name: COLUMN clients.address; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.address IS 'Adresse complète';


--
-- Name: COLUMN clients.city; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.city IS 'Ville';


--
-- Name: COLUMN clients.postal_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.postal_code IS 'Code postal';


--
-- Name: COLUMN clients.country_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.country_code IS 'Code pays ISO 3166-1 alpha-2';


--
-- Name: COLUMN clients.vat_number; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.vat_number IS 'Numéro de TVA intracommunautaire';


--
-- Name: COLUMN clients.created_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.created_at IS 'Date de création';


--
-- Name: COLUMN clients.updated_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.clients.updated_at IS 'Date de mise à jour';


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.clients_id_seq OWNER TO francois;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.clients_id_seq OWNED BY invoicing.clients.id;


--
-- Name: invoice_attachments; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.invoice_attachments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    attachment_type text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    stored_name character varying(255) NOT NULL,
    CONSTRAINT invoice_attachments_type_check CHECK ((attachment_type = ANY (ARRAY[('main'::character varying)::text, ('additional'::character varying)::text])))
);


ALTER TABLE invoicing.invoice_attachments OWNER TO francois;

--
-- Name: invoice_attachments_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.invoice_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.invoice_attachments_id_seq OWNER TO francois;

--
-- Name: invoice_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.invoice_attachments_id_seq OWNED BY invoicing.invoice_attachments.id;


--
-- Name: invoice_client; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.invoice_client (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    legal_name character varying(255) NOT NULL,
    legal_identifier_type character varying(50) NOT NULL,
    legal_identifier character varying(50) NOT NULL,
    address text,
    city character varying(100),
    postal_code character varying(20),
    country_code character(2),
    created_at timestamp without time zone DEFAULT now(),
    email character varying(255),
    phone character varying(50)
);


ALTER TABLE invoicing.invoice_client OWNER TO francois;

--
-- Name: COLUMN invoice_client.legal_name; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.legal_name IS 'Raison sociale ou nom/prénom du client au moment de la facture';


--
-- Name: COLUMN invoice_client.legal_identifier_type; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.legal_identifier_type IS 'Type d''identifiant (SIRET, TVA intra, Nom)';


--
-- Name: COLUMN invoice_client.legal_identifier; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.legal_identifier IS 'Identifiant du client (SIRET, TVA intra ou nom complet)';


--
-- Name: COLUMN invoice_client.address; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.address IS 'Adresse du client';


--
-- Name: COLUMN invoice_client.city; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.city IS 'Ville du client';


--
-- Name: COLUMN invoice_client.postal_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.postal_code IS 'Code postal du client';


--
-- Name: COLUMN invoice_client.country_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_client.country_code IS 'Code pays ISO 3166-1 alpha-2';


--
-- Name: invoice_client_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.invoice_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.invoice_client_id_seq OWNER TO francois;

--
-- Name: invoice_client_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.invoice_client_id_seq OWNED BY invoicing.invoice_client.id;


--
-- Name: invoice_lines; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.invoice_lines (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description text NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    vat_rate numeric(5,2) NOT NULL,
    discount numeric(14,2) DEFAULT 0,
    line_net numeric(14,2),
    line_tax numeric(14,2),
    line_total numeric(14,2)
);


ALTER TABLE invoicing.invoice_lines OWNER TO francois;

--
-- Name: COLUMN invoice_lines.id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.id IS 'Identifiant unique de la ligne';


--
-- Name: COLUMN invoice_lines.invoice_id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.invoice_id IS 'Référence vers la facture';


--
-- Name: COLUMN invoice_lines.description; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.description IS 'Description de la ligne';


--
-- Name: COLUMN invoice_lines.quantity; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.quantity IS 'Quantité';


--
-- Name: COLUMN invoice_lines.unit_price; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.unit_price IS 'Prix unitaire HT';


--
-- Name: COLUMN invoice_lines.vat_rate; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.vat_rate IS 'Taux TVA en pourcentage';


--
-- Name: COLUMN invoice_lines.discount; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.discount IS 'Remise éventuelle';


--
-- Name: COLUMN invoice_lines.line_net; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.line_net IS 'Montant HT après remise';


--
-- Name: COLUMN invoice_lines.line_tax; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.line_tax IS 'Montant TVA ligne';


--
-- Name: COLUMN invoice_lines.line_total; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_lines.line_total IS 'Montant TTC ligne';


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.invoice_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.invoice_lines_id_seq OWNER TO francois;

--
-- Name: invoice_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.invoice_lines_id_seq OWNED BY invoicing.invoice_lines.id;


--
-- Name: invoice_status; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.invoice_status (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    status_code integer NOT NULL,
    status_label character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    client_comment text
);


ALTER TABLE invoicing.invoice_status OWNER TO francois;

--
-- Name: TABLE invoice_status; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON TABLE invoicing.invoice_status IS 'Historique des statuts liés au cycle de vie des factures (PDP)';


--
-- Name: COLUMN invoice_status.id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_status.id IS 'Identifiant unique interne du statut';


--
-- Name: COLUMN invoice_status.invoice_id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_status.invoice_id IS 'Référence vers la facture concernée';


--
-- Name: COLUMN invoice_status.status_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_status.status_code IS 'Code du statut remonté par le PDP (200, 201, ... )';


--
-- Name: COLUMN invoice_status.status_label; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_status.status_label IS 'Libellé du statut correspondant';


--
-- Name: COLUMN invoice_status.created_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_status.created_at IS 'Date et heure d’enregistrement du statut';


--
-- Name: COLUMN invoice_status.client_comment; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_status.client_comment IS 'Commentaire éventuel du client pour ce statut (refus, litige, approbation partielle)';


--
-- Name: invoice_status_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.invoice_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.invoice_status_id_seq OWNER TO francois;

--
-- Name: invoice_status_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.invoice_status_id_seq OWNED BY invoicing.invoice_status.id;


--
-- Name: invoice_taxes; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.invoice_taxes (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    vat_rate numeric(5,2) NOT NULL,
    base_amount numeric(14,2) NOT NULL,
    tax_amount numeric(14,2) NOT NULL
);


ALTER TABLE invoicing.invoice_taxes OWNER TO francois;

--
-- Name: COLUMN invoice_taxes.id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_taxes.id IS 'Identifiant unique de l’assiette';


--
-- Name: COLUMN invoice_taxes.invoice_id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_taxes.invoice_id IS 'Référence vers la facture';


--
-- Name: COLUMN invoice_taxes.vat_rate; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_taxes.vat_rate IS 'Taux TVA';


--
-- Name: COLUMN invoice_taxes.base_amount; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_taxes.base_amount IS 'Base HT (assiette)';


--
-- Name: COLUMN invoice_taxes.tax_amount; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoice_taxes.tax_amount IS 'Montant TVA';


--
-- Name: invoice_taxes_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.invoice_taxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.invoice_taxes_id_seq OWNER TO francois;

--
-- Name: invoice_taxes_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.invoice_taxes_id_seq OWNED BY invoicing.invoice_taxes.id;


--
-- Name: invoices; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.invoices (
    id integer NOT NULL,
    invoice_number character(20) NOT NULL,
    issue_date date NOT NULL,
    supply_date date,
    currency character(3) DEFAULT 'EUR'::bpchar,
    contract_number character varying(100),
    purchase_order_number character varying(100),
    seller_id integer NOT NULL,
    client_id integer,
    seller_legal_name character varying(255) NOT NULL,
    subtotal numeric(14,2),
    total_taxes numeric(14,2),
    total numeric(14,2),
    payment_terms text,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    fiscal_year integer NOT NULL,
    payment_method character varying(50),
    technical_status character varying(20) DEFAULT 'pending'::character varying,
    submission_id character varying(50),
    last_technical_update timestamp without time zone DEFAULT now(),
    business_status character varying(50) DEFAULT 'pending'::character varying,
    CONSTRAINT chk_fiscal_year_range CHECK (((fiscal_year >= 2000) AND (fiscal_year <= 2100))),
    CONSTRAINT chk_fiscal_year_reasonable CHECK (((fiscal_year >= ((EXTRACT(year FROM issue_date))::integer - 1)) AND (fiscal_year <= ((EXTRACT(year FROM issue_date))::integer + 1))))
);


ALTER TABLE invoicing.invoices OWNER TO francois;

--
-- Name: COLUMN invoices.id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.id IS 'Identifiant unique interne de la facture';


--
-- Name: COLUMN invoices.invoice_number; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.invoice_number IS 'Référence facture chez l’émetteur (max 20 caractères)';


--
-- Name: COLUMN invoices.issue_date; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.issue_date IS 'Date d''émission de la facture';


--
-- Name: COLUMN invoices.supply_date; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.supply_date IS 'Date de livraison ou prestation';


--
-- Name: COLUMN invoices.currency; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.currency IS 'Devise ISO 4217';


--
-- Name: COLUMN invoices.contract_number; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.contract_number IS 'Numéro de marché / contrat (engagement)';


--
-- Name: COLUMN invoices.purchase_order_number; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.purchase_order_number IS 'Numéro de commande (engagement)';


--
-- Name: COLUMN invoices.seller_id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.seller_id IS 'Référence vers le vendeur';


--
-- Name: COLUMN invoices.client_id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.client_id IS 'Référence vers l''acheteur';


--
-- Name: COLUMN invoices.seller_legal_name; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.seller_legal_name IS 'Raison sociale du vendeur (dupliquée pour historique)';


--
-- Name: COLUMN invoices.subtotal; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.subtotal IS 'Montant HT total';


--
-- Name: COLUMN invoices.total_taxes; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.total_taxes IS 'Montant total TVA';


--
-- Name: COLUMN invoices.total; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.total IS 'Montant TTC total';


--
-- Name: COLUMN invoices.payment_terms; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.payment_terms IS 'Conditions de paiement';


--
-- Name: COLUMN invoices.status; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.status IS 'Statut (draft, final, canceled)';


--
-- Name: COLUMN invoices.created_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.created_at IS 'Date de création';


--
-- Name: COLUMN invoices.updated_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.updated_at IS 'Date de mise à jour';


--
-- Name: COLUMN invoices.fiscal_year; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.fiscal_year IS 'Année fiscale (année de l''émission de la facture)';


--
-- Name: COLUMN invoices.payment_method; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.invoices.payment_method IS 'Moyen de paiement utilisé pour la facture';


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.invoices_id_seq OWNER TO francois;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.invoices_id_seq OWNED BY invoicing.invoices.id;


--
-- Name: sellers; Type: TABLE; Schema: invoicing; Owner: francois
--

CREATE TABLE invoicing.sellers (
    id integer NOT NULL,
    legal_name character varying(255) NOT NULL,
    legal_identifier character varying(50) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country_code character(2) DEFAULT 'FR'::bpchar NOT NULL,
    vat_number character varying(50),
    registration_info text,
    share_capital numeric(14,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    contact_email character varying(255) NOT NULL,
    phone_number character varying(50),
    company_type character varying(50) DEFAULT 'MICRO'::character varying NOT NULL,
    iban character varying(34),
    bic character varying(11),
    payment_method character varying(100),
    payment_terms character varying(50),
    additional_1 text,
    additional_2 text,
    auth0_id character varying(255),
    CONSTRAINT siret_format_check CHECK ((((legal_identifier)::text ~ '^\d{14}$'::text) OR (country_code <> 'FR'::bpchar)))
);


ALTER TABLE invoicing.sellers OWNER TO francois;

--
-- Name: COLUMN sellers.id; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.id IS 'Identifiant unique interne du vendeur';


--
-- Name: COLUMN sellers.legal_name; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.legal_name IS 'Raison sociale';


--
-- Name: COLUMN sellers.legal_identifier; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';


--
-- Name: COLUMN sellers.address; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.address IS 'Adresse complète';


--
-- Name: COLUMN sellers.city; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.city IS 'Ville';


--
-- Name: COLUMN sellers.postal_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.postal_code IS 'Code postal';


--
-- Name: COLUMN sellers.country_code; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.country_code IS 'Code pays ISO 3166-1 alpha-2';


--
-- Name: COLUMN sellers.vat_number; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.vat_number IS 'Numéro de TVA intracommunautaire';


--
-- Name: COLUMN sellers.registration_info; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.registration_info IS 'Informations d''enregistrement (ex: RCS, registre du commerce)';


--
-- Name: COLUMN sellers.share_capital; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.share_capital IS 'Capital social';


--
-- Name: COLUMN sellers.created_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.created_at IS 'Date de création';


--
-- Name: COLUMN sellers.updated_at; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.updated_at IS 'Date de mise à jour';


--
-- Name: COLUMN sellers.contact_email; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.contact_email IS 'Adresse email de contact du vendeur (facturation, support)';


--
-- Name: COLUMN sellers.phone_number; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.phone_number IS 'Numéro de téléphone du vendeur';


--
-- Name: COLUMN sellers.company_type; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.company_type IS 'Type de société : MICRO, EI, SAS, SARL, SA, etc.';


--
-- Name: COLUMN sellers.payment_method; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.payment_method IS 'Moyen de paiement du vendeur (ex: Virement, Chèque, Carte bancaire)';


--
-- Name: COLUMN sellers.payment_terms; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.payment_terms IS 'Conditions de paiement du vendeur (ex: À 30 jours, À réception)';


--
-- Name: COLUMN sellers.additional_1; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.additional_1 IS 'Mention complémentaire 1 à afficher sur les factures';


--
-- Name: COLUMN sellers.additional_2; Type: COMMENT; Schema: invoicing; Owner: francois
--

COMMENT ON COLUMN invoicing.sellers.additional_2 IS 'Mention complémentaire 2 à afficher sur les factures';


--
-- Name: sellers_id_seq; Type: SEQUENCE; Schema: invoicing; Owner: francois
--

CREATE SEQUENCE invoicing.sellers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE invoicing.sellers_id_seq OWNER TO francois;

--
-- Name: sellers_id_seq; Type: SEQUENCE OWNED BY; Schema: invoicing; Owner: francois
--

ALTER SEQUENCE invoicing.sellers_id_seq OWNED BY invoicing.sellers.id;


--
-- Name: clients id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.clients ALTER COLUMN id SET DEFAULT nextval('invoicing.clients_id_seq'::regclass);


--
-- Name: invoice_attachments id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_attachments ALTER COLUMN id SET DEFAULT nextval('invoicing.invoice_attachments_id_seq'::regclass);


--
-- Name: invoice_client id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_client ALTER COLUMN id SET DEFAULT nextval('invoicing.invoice_client_id_seq'::regclass);


--
-- Name: invoice_lines id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_lines ALTER COLUMN id SET DEFAULT nextval('invoicing.invoice_lines_id_seq'::regclass);


--
-- Name: invoice_status id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_status ALTER COLUMN id SET DEFAULT nextval('invoicing.invoice_status_id_seq'::regclass);


--
-- Name: invoice_taxes id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_taxes ALTER COLUMN id SET DEFAULT nextval('invoicing.invoice_taxes_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoices ALTER COLUMN id SET DEFAULT nextval('invoicing.invoices_id_seq'::regclass);


--
-- Name: sellers id; Type: DEFAULT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.sellers ALTER COLUMN id SET DEFAULT nextval('invoicing.sellers_id_seq'::regclass);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.clients (id, legal_name, legal_identifier, address, city, postal_code, country_code, vat_number, created_at, updated_at, firstname, lastname, is_company, siret, email, phone, seller_id) FROM stdin;
40	Dupont SARL	20065220200017	10 rue de la République	Paris	75000	FR	\N	2025-08-24 18:03:47.082312	2025-09-23 10:04:18.487629	\N	\N	t	20065220200017	dupont@example.fr	+33123456790	23
61	Poulp Info	50101632154022	Route de Revel	\N	\N	FR		2025-09-18 12:39:48.70044	2025-09-18 12:46:20.955502			t	50101632154022	\N	\N	23
50	Hello Tech	51978079500489	test			FR	\N	2025-09-07 17:27:57.226324	2025-09-19 22:37:55.714218	\N	\N	t	51978079500489	\N	\N	31
27	Hello Tech	45678964564009	Rue des druides	Toulouse	31000	FR		2025-08-20 21:49:51.449725	2025-09-19 22:39:34.121421			t	45678964564009	contact@hellotech.com	0561200001	23
31	Jazz	80838614800015	Route d'Espagne	Toulouse	31000	FR		2025-08-20 22:07:10.388093	2025-09-18 10:33:44.206135			t	80838614800015	contact@jazz.fr	0619079218	23
26	Bel'Air	39262263500010	Route des lilas		31000	FR		2025-08-20 21:10:27.556113	2025-09-22 15:47:54.948492			t	39262263500010	contact@nice-tech.fr	0600000000	23
43	François Bonnafous	\N	156 allées de Nanbours	Auzielle	31650	FR	\N	2025-08-26 08:57:40.500839	2025-09-19 22:38:27.543872	François	Bonnafous	f	\N	francois.bonnafous@hotmail.fr	0619079219	31
29	John Doe	\N				FR		2025-08-20 21:51:29.281034	2025-09-07 19:14:34.592033	John	Doe	f	\N	vendeur@ymail.com		23
28	Finish client	FI TVA Intra	Helsinki	\N	\N	FI	FI TVA Intra	2025-08-20 21:50:59.572546	2025-08-28 08:41:37.072293			t	\N			23
49	Another	21708501000189			21450	FR		2025-08-28 23:30:41.484485	2025-09-08 09:44:30.253827			t	21708501000189	contact@another.fr	056100	31
59	Baggy Le Clown	\N	Route du port			FR		2025-09-11 09:07:23.381337	2025-09-11 09:56:42.309259	Baggy	Le Clown	f	\N	\N	0600000002	38
\.


--
-- Data for Name: invoice_attachments; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.invoice_attachments (id, invoice_id, file_name, file_path, attachment_type, uploaded_at, stored_name) FROM stdin;
384	167	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/167_main_1756929048803_modele_de_facture.pdf	main	2025-09-03 21:50:48.780892	167_main_1756929048803_modele_de_facture.pdf
385	167	note_de_credit_fr.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/167_add_1756929048804_note_de_credit_fr.pdf	additional	2025-09-03 21:50:48.780892	167_add_1756929048804_note_de_credit_fr.pdf
395	173	Projet-de-facturation-electronique.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/173_main_1756967626201_Projet-de-facturation-electronique.pdf	main	2025-09-04 08:33:46.184633	173_main_1756967626201_Projet-de-facturation-electronique.pdf
396	173	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/173_add_1756967626203_modele_de_facture.pdf	additional	2025-09-04 08:33:46.184633	173_add_1756967626203_modele_de_facture.pdf
271	169	note_de_credit_fr.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/169_main_1756845637882_note_de_credit_fr.pdf	main	2025-09-02 22:40:37.87161	169_main_1756845637882_note_de_credit_fr.pdf
272	169	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/169_add_1756845637883_modele_de_facture.pdf	additional	2025-09-02 22:40:37.87161	169_add_1756845637883_modele_de_facture.pdf
429	174	todo.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/174_add_1756987057156_todo.md	additional	2025-09-04 13:57:37.137264	174_add_1756987057156_todo.md
430	174	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/174_main_1756987057158_modele_de_facture.pdf	main	2025-09-04 13:57:37.137264	174_main_1756987057158_modele_de_facture.pdf
174	163	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/163_1756497188728_journal_jour1.md	main	2025-08-29 21:53:08.71515	163_1756497188728_journal_jour1.md
574	193	Refacto 0917.1.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/193_main_1758127892533_Refacto_0917.1.pdf	main	2025-09-17 18:51:32.522495	193_main_1758127892533_Refacto_0917.1.pdf
575	193	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/193_add_1758127892534_modele_de_facture.pdf	additional	2025-09-17 18:51:32.522495	193_add_1758127892534_modele_de_facture.pdf
588	198	Refacto 0917.6.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/198_main_1758139469377_Refacto_0917.6.pdf	main	2025-09-17 22:04:29.351966	198_main_1758139469377_Refacto_0917.6.pdf
590	181	facture_Refacto 0917.6 .pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/181_main_1758181969946_facture_Refacto_0917.6_.pdf	main	2025-09-18 09:52:49.938222	181_main_1758181969946_facture_Refacto_0917.6_.pdf
594	200	168_pdf-a3.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/200_add_1758192263069_168_pdf-a3.pdf	additional	2025-09-18 12:44:23.054444	200_add_1758192263069_168_pdf-a3.pdf
596	137	Scope.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/137_main_1758314275726_Scope.pdf	main	2025-09-19 22:37:55.714218	137_main_1758314275726_Scope.pdf
599	202	PDFA3 0910.1.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/202_main_1758387146230_PDFA3_0910.1.pdf	main	2025-09-20 18:52:26.217963	202_main_1758387146230_PDFA3_0910.1.pdf
600	202	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/202_add_1758387146232_modele_de_facture.pdf	additional	2025-09-20 18:52:26.217963	202_add_1758387146232_modele_de_facture.pdf
601	203	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/203_main_1758547589476_modele_de_facture.pdf	main	2025-09-22 15:26:29.468831	203_main_1758547589476_modele_de_facture.pdf
141	162	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/162_141_journal_jour1.md	main	2025-08-29 09:29:35.370461	162_141_journal_jour1.md
267	171	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/171_main_1756845291626_journal_jour1.md	main	2025-09-02 22:34:51.615745	171_main_1756845291626_journal_jour1.md
268	171	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/171_add_1756845291632_journal_jour1.txt	additional	2025-09-02 22:34:51.615745	171_add_1756845291632_journal_jour1.txt
115	148	Capture dâÃ©cran du 2025-08-11 18-22-05.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756367081529-589864540-Capture dâÃ©cran du 2025-08-11 18-22-05.png	main	2025-08-28 09:44:41.544434	Capture dâÃ©cran du 2025-08-11 18-22-05.png
116	149	Capture dâÃ©cran du 2025-08-11 19-51-30.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756369059318-649189415-Capture dâÃ©cran du 2025-08-11 19-51-30.png	main	2025-08-28 10:17:39.327323	Capture dâÃ©cran du 2025-08-11 19-51-30.png
117	150	Capture dâÃ©cran du 2025-08-11 18-23-51.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756369702430-219215040-Capture dâÃ©cran du 2025-08-11 18-23-51.png	main	2025-08-28 10:28:22.438402	Capture dâÃ©cran du 2025-08-11 18-23-51.png
118	151	Capture dâÃ©cran du 2025-08-11 19-51-30.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756369762919-475741361-Capture dâÃ©cran du 2025-08-11 19-51-30.png	main	2025-08-28 10:29:22.933276	Capture dâÃ©cran du 2025-08-11 19-51-30.png
269	171	factur-x.xml	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/171_add_1756845291634_factur-x.xml	additional	2025-09-02 22:34:51.615745	171_add_1756845291634_factur-x.xml
130	155	Capture dâÃ©cran du 2025-08-11 18-23-51.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756415310704-492937246-Capture dâÃ©cran du 2025-08-11 18-23-51.png	main	2025-08-28 11:08:30.718	Capture dâÃ©cran du 2025-08-11 18-23-51.png
175	164	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/164_1756497242012_modele_de_facture.pdf	main	2025-08-29 21:54:02.00051	164_1756497242012_modele_de_facture.pdf
582	195	Refacto 0917.3.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/195_main_1758128945024_Refacto_0917.3.pdf	main	2025-09-17 19:09:05.014623	195_main_1758128945024_Refacto_0917.3.pdf
583	195	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/195_add_1758128945024_modele_de_facture.pdf	additional	2025-09-17 19:09:05.014623	195_add_1758128945024_modele_de_facture.pdf
587	197	Refacto 0917.5.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/197_main_1758131619837_Refacto_0917.5.pdf	main	2025-09-17 19:53:39.830256	197_main_1758131619837_Refacto_0917.5.pdf
589	199	facture_Refacto 0917.6 .pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/199_main_1758142481450_facture_Refacto_0917.6_.pdf	main	2025-09-17 22:54:41.434187	199_main_1758142481450_facture_Refacto_0917.6_.pdf
591	182	facture_Afternoon 0916.1 -1.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/182_main_1758182246310_facture_Afternoon_0916.1_-1.pdf	main	2025-09-18 09:57:26.302212	182_main_1758182246310_facture_Afternoon_0916.1_-1.pdf
595	201	Scope.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/201_main_1758192380965_Scope.pdf	main	2025-09-18 12:46:20.955502	201_main_1758192380965_Scope.pdf
597	153	Scope.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/153_main_1758314307555_Scope.pdf	main	2025-09-19 22:38:27.543872	153_main_1758314307555_Scope.pdf
455	168	Projet-de-facturation-electronique.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/168_main_1757002817566_Projet-de-facturation-electronique.pdf	main	2025-09-04 18:20:17.553899	168_main_1757002817566_Projet-de-facturation-electronique.pdf
66	103	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756123689048-855822326-journal_jour1.md	main	2025-08-25 14:08:09.061861	journal_jour1.md
67	104	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756123785410-417536850-journal_jour1.md	main	2025-08-25 14:09:45.420015	journal_jour1.md
68	105	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756123999364-519491220-journal_jour1.md	main	2025-08-25 14:13:19.371911	journal_jour1.md
69	106	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756124146944-64259528-journal_jour1.md	main	2025-08-25 14:15:46.952981	journal_jour1.md
70	107	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756124575282-999888745-journal_jour1.md	main	2025-08-25 14:22:55.296108	journal_jour1.md
71	108	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756124672153-146037123-journal_jour1.md	main	2025-08-25 14:24:32.16068	journal_jour1.md
72	110	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756134320241-446486926-journal_jour1.md	main	2025-08-25 17:05:20.255621	journal_jour1.md
73	111	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756134555162-29273521-journal_jour1.md	main	2025-08-25 17:09:15.175338	journal_jour1.md
74	112	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756134768700-864296944-journal_jour1.md	main	2025-08-25 17:12:48.712208	journal_jour1.md
75	113	README(1).md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756134963332-863617284-README(1).md	main	2025-08-25 17:16:03.345612	README(1).md
76	114	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756135781176-120974590-journal_jour1.md	main	2025-08-25 17:29:41.184214	journal_jour1.md
77	116	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756142086103-780757572-journal_jour1.md	main	2025-08-25 19:14:46.114038	journal_jour1.md
78	118	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756153902892-645139458-journal_jour1.md	main	2025-08-25 22:31:42.902459	journal_jour1.md
79	119	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756155961852-246182013-journal_jour1.md	main	2025-08-25 23:06:01.861152	journal_jour1.md
80	120	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756156618477-242554961-journal_jour1.md	main	2025-08-25 23:16:58.48087	journal_jour1.md
81	121	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756191460458-806856046-journal_jour1.md	main	2025-08-26 08:57:40.472313	journal_jour1.md
82	122	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756192122800-965890428-journal_jour1.md	main	2025-08-26 09:08:42.815023	journal_jour1.md
83	123	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756192318483-133035745-journal_jour1.md	main	2025-08-26 09:11:58.492444	journal_jour1.md
84	124	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756197388516-583904470-journal_jour1.md	main	2025-08-26 10:36:28.528423	journal_jour1.md
85	125	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756277079491-944367191-journal_jour1.md	main	2025-08-27 08:44:39.504562	journal_jour1.md
86	126	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756277121166-821261248-journal_jour1.md	main	2025-08-27 08:45:21.17867	journal_jour1.md
87	127	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756277278293-207141609-journal_jour1.md	main	2025-08-27 08:47:58.302405	journal_jour1.md
88	128	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756277763799-543870619-journal_jour1.md	main	2025-08-27 08:56:03.808327	journal_jour1.md
89	129	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756278386011-714428911-journal_jour1.txt	main	2025-08-27 09:06:26.013273	journal_jour1.txt
90	130	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756278585367-796390989-journal_jour1.md	main	2025-08-27 09:09:45.36988	journal_jour1.md
91	131	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756278762545-395624203-journal_jour1.txt	main	2025-08-27 09:12:42.558214	journal_jour1.txt
92	132	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756279217587-442016990-journal_jour1.md	main	2025-08-27 09:20:17.600509	journal_jour1.md
93	133	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756279501965-333498105-journal_jour1.txt	main	2025-08-27 09:25:01.979056	journal_jour1.txt
94	134	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756280177971-673296859-journal_jour1.md	main	2025-08-27 09:36:17.979242	journal_jour1.md
95	135	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756284982923-675764634-journal_jour1.txt	main	2025-08-27 10:56:22.935431	journal_jour1.txt
96	136	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756287162305-824017628-journal_jour1.txt	main	2025-08-27 11:32:42.312779	journal_jour1.txt
102	138	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756315459902-266318880-journal_jour1.md	main	2025-08-27 11:24:19.915	journal_jour1.md
104	139	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756328031152-433042870-journal_jour1.md	main	2025-08-27 20:53:51.165	journal_jour1.md
105	140	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756328148533-721234461-journal_jour1.md	main	2025-08-27 22:55:48.543781	journal_jour1.md
106	142	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756328296766-503720928-journal_jour1.txt	main	2025-08-27 22:58:16.780708	journal_jour1.txt
107	143	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756328645719-434127629-journal_jour1.md	main	2025-08-27 23:04:05.728733	journal_jour1.md
108	144	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756330712435-729202906-journal_jour1.md	main	2025-08-27 23:38:32.442475	journal_jour1.md
110	145	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756363297059-396182570-journal_jour1.md	main	2025-08-28 06:41:37.072	journal_jour1.md
111	146	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756363853285-641880252-journal_jour1.md	main	2025-08-28 08:50:53.298895	journal_jour1.md
112	146	journal_jour1.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756363853285-76307991-journal_jour1.txt	additional	2025-08-28 08:50:53.298895	journal_jour1.txt
113	146	Capture dâÃ©cran du 2025-08-06 20-35-56.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756363853285-109193405-Capture dâÃ©cran du 2025-08-06 20-35-56.png	additional	2025-08-28 08:50:53.298895	Capture dâÃ©cran du 2025-08-06 20-35-56.png
114	147	Capture dâÃ©cran du 2025-08-11 18-23-51.png	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756364758011-50420644-Capture dâÃ©cran du 2025-08-11 18-23-51.png	main	2025-08-28 09:05:58.019246	Capture dâÃ©cran du 2025-08-11 18-23-51.png
135	156	hs_err_pid4249.log	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756450210057-905912723-hs_err_pid4249.log	main	2025-08-29 08:50:10.066866	hs_err_pid4249.log
64	101	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/1756113084443-227575316-journal_jour1.md	main	2025-08-25 11:11:24.450965	journal_jour1.md
456	168	todo.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/168_add_1757002817567_todo.md	additional	2025-09-04 18:20:17.553899	168_add_1757002817567_todo.md
572	192	Morning 0907.2.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/192_main_1758095963512_Morning_0907.2.pdf	main	2025-09-17 09:59:23.502587	192_main_1758095963512_Morning_0907.2.pdf
573	192	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/192_add_1758095963514_modele_de_facture.pdf	additional	2025-09-17 09:59:23.502587	192_add_1758095963514_modele_de_facture.pdf
578	194	Refacto 0917.1.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/194_main_1758128546087_Refacto_0917.1.pdf	main	2025-09-17 19:02:26.072428	194_main_1758128546087_Refacto_0917.1.pdf
579	194	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/194_add_1758128546088_modele_de_facture.pdf	additional	2025-09-17 19:02:26.072428	194_add_1758128546088_modele_de_facture.pdf
584	196	Refacto 0917.4.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/196_main_1758129301301_Refacto_0917.4.pdf	main	2025-09-17 19:15:01.293439	196_main_1758129301301_Refacto_0917.4.pdf
585	196	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/196_add_1758129301302_modele_de_facture.pdf	additional	2025-09-17 19:15:01.293439	196_add_1758129301302_modele_de_facture.pdf
592	200	Scope.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/200_main_1758182390058_Scope.pdf	main	2025-09-18 09:59:50.050023	200_main_1758182390058_Scope.pdf
307	172	modele_de_facture.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/172_main_1756885692689_modele_de_facture.pdf	main	2025-09-03 09:48:12.676295	172_main_1756885692689_modele_de_facture.pdf
308	172	journal_jour1.md	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/172_add_1756885692691_journal_jour1.md	additional	2025-09-03 09:48:12.676295	172_add_1756885692691_journal_jour1.md
309	172	prompts.txt	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/172_add_1756885692692_prompts.txt	additional	2025-09-03 09:48:12.676295	172_add_1756885692692_prompts.txt
310	172	note_de_credit_fr.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/172_add_1756885692693_note_de_credit_fr.pdf	additional	2025-09-03 09:48:12.676295	172_add_1756885692693_note_de_credit_fr.pdf
598	154	Scope.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/154_main_1758314374132_Scope.pdf	main	2025-09-19 22:39:34.121421	154_main_1758314374132_Scope.pdf
603	204	Initial 2.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/204_main_1758549128921_Initial_2.pdf	main	2025-09-22 15:52:08.912442	204_main_1758549128921_Initial_2.pdf
518	175	note_de_credit_fr.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/175_main_1757173440173_note_de_credit_fr.pdf	main	2025-09-06 17:44:00.162849	175_main_1757173440173_note_de_credit_fr.pdf
519	175	Projet-de-facturation-electronique.pdf	/home/francois/dev/eInvoicing/backend/src/uploads/invoices/175_add_1757173440174_Projet-de-facturation-electronique.pdf	additional	2025-09-06 17:44:00.162849	175_add_1757173440174_Projet-de-facturation-electronique.pdf
\.


--
-- Data for Name: invoice_client; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.invoice_client (id, invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code, created_at, email, phone) FROM stdin;
4	114	Hello World	NAME	Hello World	4564	R	+5	FR	2025-08-25 17:29:41.208346	\N	\N
9	121	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-26 08:57:40.500839	\N	\N
10	122	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-26 09:08:42.843827	\N	\N
11	123	Brussel	VAT	BR A654413	Bruxelle	\N	\N	BE	2025-08-26 09:11:58.518449	\N	\N
13	133	Test Client	NAME	Test Client	123 rue exemple	\N	\N	FR	2025-08-27 09:25:01.979056	\N	\N
15	135	Brussel	VAT	BR A654413	Bruxelle	\N	\N	BE	2025-08-27 10:56:22.935431	\N	\N
3	113	Nice Tech	SIRET	39262263500010	la	Toulouse	31650	FR	2025-08-25 17:16:03.374259	\N	\N
18	138	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-27 19:24:19.915871	\N	\N
19	139	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-27 22:53:51.165156	\N	\N
20	140	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-27 22:55:48.543781	\N	\N
21	142	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-27 22:58:16.780708	\N	\N
22	143	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-27 23:04:05.728733	\N	\N
24	145	Finish client	VAT	FI TVA Intra	Helsinki			FI	2025-08-28 08:41:37.072293	\N	\N
25	146	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-28 08:50:53.298895	\N	\N
27	148	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-28 09:44:41.544434	\N	\N
12	124	Dupont SARL	SIRET	12345678901234	10 rue de la République	Paris	75001	FR	2025-08-26 10:36:28.554592	dupont@example.fr	+33123456790
32	149	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-28 10:17:39.327323	\N	\N
33	150	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-28 10:28:22.438402	\N	\N
34	151	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-28 10:29:22.933276	francois.bonnafous@hotmail.fr	0619079219
57	174	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-09-03 09:52:33.816841	francois.bonnafous@hotmail.fr	0619079219
14	134	Nice Tech	SIRET	39262263500010	\N	\N	\N	FR	2025-08-27 09:36:17.979242	\N	\N
17	137	Hello Tech	SIRET	51978079500489	test			FR	2025-08-27 19:17:01.777256	\N	\N
52	169	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-09-02 22:10:35.001755	francois.bonnafous@hotmail.fr	0619079219
36	153	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-08-28 17:28:15.913773	francois.bonnafous@hotmail.fr	0619079219
58	175	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-09-04 13:59:24.067895	francois.bonnafous@hotmail.fr	0619079219
60	177	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-09-07 00:20:20.19941	francois.bonnafous@hotmail.fr	0619079219
56	173	François Bonnafous	NAME	François Bonnafous	156 allées de Nanbours	Auzielle	31650	FR	2025-09-02 22:41:57.509794	francois.bonnafous@hotmail.fr	0619079219
2	112	Hello Tech	SIRET	51978079500489	465	\N	\N	FR	2025-08-25 17:12:48.740665	\N	\N
5	116	Hello Tech	SIRET	51978079500489	456	\N	\N	FR	2025-08-25 19:14:46.149454	\N	\N
6	118	Hello Tech	SIRET	51978079500489	Toulouse	\N	\N	FR	2025-08-25 22:31:42.939156	\N	\N
8	120	Hello Tech	SIRET	51978079500489	test	\N	\N	FR	2025-08-25 23:16:58.508874	\N	\N
16	136	Hello Tech	SIRET	51978079500489	test	\N	\N	FR	2025-08-27 11:32:42.312779	\N	\N
39	156	Hello Tech	SIRET	51978079500489	test			FR	2025-08-29 00:06:40.464503	contact@cultura.com	0561200001
23	144	Hello Tech	SIRET	51978079500489	test	\N	\N	FR	2025-08-27 23:38:32.442475	\N	\N
26	147	Hello Tech	SIRET	51978079500489	test	\N	\N	FR	2025-08-28 09:05:58.019246	\N	\N
45	162	Hello Tech	SIRET	51978079500489	test	\N	\N	FR	2025-08-29 09:29:35.370461	contact@cultura.com	0561200001
38	155	Hello Tech	SIRET	51978079500489	test			FR	2025-08-28 23:08:30.718387	contact@cultura.com	0561200001
54	171	Hello Tech	SIRET	51978079500489	test			FR	2025-09-02 22:26:25.745233	contact@cultura.com	0561200001
53	170	Hello Tech	SIRET	51978079500489	test			FR	2025-09-02 22:22:45.199335	contact@cultura.com	0561200001
55	172	Hello Tech	SIRET	51978079500489	test			FR	2025-09-02 22:37:17.951991	contact@cultura.com	0561200001
49	166	Hello Tech	SIRET	51978079500489	test			FR	2025-08-29 09:40:19.271924	contact@cultura.com	0561200001
59	176	Hello Tech	SIRET	51978079500489	test	\N	\N	FR	2025-09-07 00:09:18.997126	contact@cultura.com	0561200001
51	168	Hello Tech	SIRET	51978079500489	test			FR	2025-08-30 18:54:31.181085	contact@cultura.com	0561200001
46	163	Hello Tech	SIRET	51978079500489	test			FR	2025-08-29 09:30:42.875586	contact@cultura.com	0561200001
47	164	Hello Tech	SIRET	51978079500489	test			FR	2025-08-29 09:34:10.330947	contact@cultura.com	0561200001
50	167	Hello Tech	SIRET	51978079500489	test			FR	2025-08-29 18:54:51.476383	contact@cultura.com	0561200001
61	178	François Bonnafous	NAME	François Bonnafous	18 route de Narbonne	Toulouse	31400	FR	2025-09-07 17:35:54.652225	francois.bonnafous@invoice.fr	0600000000
62	179	François Bonnafous	NAME	François Bonnafous	18 route de Narbonne	Toulouse	31400	FR	2025-09-07 18:29:07.549409	francois.bonnafous@invoice.fr	0600000000
77	194	Hello Tech	SIRET	45678964564009	Rue des druides	Toulouse	31000	FR	2025-09-17 19:02:05.199223	contact@hellotech.com	0561200001
78	195	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-17 19:08:38.068048	dupont@example.fr	+33123456790
79	196	Bel'Air	SIRET	39262263500010	Route des lilas		31000	FR	2025-09-17 19:15:01.293439	contact@nice-tech.fr	0000000000
85	202	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-20 18:52:26.217963	dupont@example.fr	+33123456790
86	203	Bel'Air	SIRET	39262263500010	Route des lilas		31000	FR	2025-09-22 15:26:29.468831	contact@nice-tech.fr	0600000000
63	180	Bel'Air	SIRET	39262263500010	Route des lilas		31000	FR	2025-09-07 19:27:28.36726	contact@nice-tech	abcd0
81	198	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-17 22:04:29.351966	dupont@example.fr	+33123456790
66	183	Baggy Le Clown	NAME	Baggy Le Clown	Route du port	\N	\N	FR	2025-09-11 09:31:07.43374	\N	\N
67	184	Baggy Le Clown	NAME	Baggy Le Clown	Route du port	\N	\N	FR	2025-09-11 09:48:36.365325	\N	\N
68	185	Baggy Le Clown	NAME	Baggy Le Clown	Route du port			FR	2025-09-11 09:55:46.788633	\N	0600000002
82	199	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-17 22:54:41.434187	dupont@example.fr	+33123456790
80	197	Jazz	SIRET	80838614800015	Route d'Espagne	Toulouse	31000	FR	2025-09-17 19:45:27.203516	contact@jazz.fr	0619079219
69	186	Bel'Air	SIRET	39262263500010	Route des lilas		31000	FR	2025-09-15 10:31:48.039369	contact@nice-tech.fr	0000000000
71	188	Bel'Air	SIRET	39262263500010	Route des lilas	\N	31000	FR	2025-09-16 09:48:36.945577	contact@nice-tech.fr	0000000000
70	187	Bel'Air	SIRET	39262263500010	Route des lilas		31000	FR	2025-09-16 09:45:46.409985	contact@nice-tech.fr	0000000000
72	189	Bel'Air	SIRET	39262263500010	Route des lilas		31000	FR	2025-09-16 11:39:46.6651	contact@nice-tech.fr	0000000000
73	190	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-16 18:00:53.093243	dupont@example.fr	+33123456790
74	191	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-17 09:38:35.840519	dupont@example.fr	+33123456790
75	192	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-17 09:53:48.556129	dupont@example.fr	+33123456790
76	193	Hello Tech	SIRET	45678964564009	Rue des druides	Toulouse	31000	FR	2025-09-17 18:51:32.522495	contact@hellotech.com	0561200001
64	181	Hello Tech	SIRET	45678964564009	Rue des druides	Toulouse	31000	FR	2025-09-09 20:50:07.536216	contact@hellotech.com	0561200001
65	182	Jazz	SIRET	80838614800015	Route d'Espagne	Toulouse	31000	FR	2025-09-09 21:52:39.408943	contact@jazz.fr	0619079218
87	204	Dupont SARL	SIRET	20065220200017	10 rue de la République	Paris	75000	FR	2025-09-22 15:49:05.638885	dupont@example.fr	+33123456790
83	200	Poulp Info	SIRET	50101632154022	Route de Revel			FR	2025-09-18 09:59:50.050023	\N	\N
84	201	Poulp Info	SIRET	50101632154022	Route de Revel	\N	\N	FR	2025-09-18 12:46:20.955502	\N	\N
37	154	Hello Tech	SIRET	45678964564009	Rue des druides	Toulouse	31000	FR	2025-08-28 22:55:13.916611	contact@hellotech.com	0561200001
\.


--
-- Data for Name: invoice_lines; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.invoice_lines (id, invoice_id, description, quantity, unit_price, vat_rate, discount, line_net, line_tax, line_total) FROM stdin;
121	138	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
701	201	Formation	1.00	100.00	20.00	0.00	100.00	20.00	120.00
123	139	Consulting	1.00	800.00	20.00	0.00	800.00	160.00	960.00
124	140	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
125	142	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
126	143	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
127	144	Ligne 1	1.00	2.00	20.00	0.00	2.00	0.40	2.40
418	173	Consulting	1.00	600.00	20.00	0.00	600.00	120.00	720.00
129	145	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
130	146	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
131	146	Ligne 2 	1.00	20.00	5.00	0.00	20.00	1.00	21.00
132	147	Ligne 1	1.00	1000.00	20.00	0.00	1000.00	200.00	1200.00
133	147	Ligne 2	2.00	50.00	10.00	0.00	100.00	10.00	110.00
134	148	Ligne 1	1.00	200.00	20.00	0.00	200.00	40.00	240.00
135	148	Ligne 2	1.00	50.00	5.00	0.00	50.00	2.50	52.50
136	149	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
137	150	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
138	151	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
702	137	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
703	153	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
704	154	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
83	101	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
85	103	Ligne 1	1.00	200.00	20.00	0.00	200.00	40.00	240.00
86	104	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
87	105	Ligne 1	1.00	1000.00	20.00	0.00	1000.00	200.00	1200.00
88	106	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
89	107	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
90	108	Ligne TVA 20	1.00	100.00	20.00	0.00	100.00	20.00	120.00
91	110	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
92	111	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
93	112	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
94	113	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
95	114	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
96	116	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
97	118	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
98	119	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
99	120	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
100	121	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
101	122	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
222	163	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
224	164	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
151	155	Ligne	1.00	100.00	20.00	0.00	100.00	20.00	120.00
152	155	Ligne 2	1.00	10.00	10.00	0.00	10.00	1.00	11.00
153	155	Ligne 3	1.00	1000.00	20.00	0.00	1000.00	200.00	1200.00
154	155	Ligne 4	1.00	500.00	5.00	0.00	500.00	25.00	525.00
363	172	Ligne 1	1.00	1000.00	20.00	0.00	1000.00	200.00	1200.00
102	123	Ligne 1	1.00	50.00	20.00	0.00	50.00	10.00	60.00
167	156	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
168	156	Ligne 2	1.00	100.00	5.00	0.00	100.00	5.00	105.00
103	124	Ligne 1	1.00	200.00	20.00	0.00	200.00	40.00	240.00
104	125	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
105	126	Ligne 1	1.00	0.00	20.00	0.00	0.00	0.00	0.00
106	127	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
107	128	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
108	129	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
109	130	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
110	131	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
111	132	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
112	133	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
113	134	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
114	135	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
115	136	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
169	156	Ligne 3	1.00	100.00	20.00	0.00	100.00	20.00	120.00
170	156	Ligne 4	1.00	200.00	10.00	0.00	200.00	20.00	220.00
656	192	Formation	1.00	200.00	20.00	0.00	200.00	40.00	240.00
657	193	Formation	1.00	200.00	20.00	0.00	200.00	40.00	240.00
659	194	Refacto	1.00	1200.00	20.00	0.00	1200.00	240.00	1440.00
178	162	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
661	195	Refacto controller	1.00	100.00	20.00	0.00	100.00	20.00	120.00
663	196	Refacto model	1.00	500.00	20.00	0.00	500.00	100.00	600.00
518	168	Ligne 1	1.00	10.00	20.00	0.00	10.00	2.00	12.00
672	198	Refacto model	1.00	500.00	20.00	0.00	500.00	100.00	600.00
673	199	Formation	1.00	50.00	20.00	0.00	50.00	10.00	60.00
194	166	Ligne 1	1.00	1.00	20.00	0.00	1.00	0.20	1.20
675	197	Refacto model	1.00	200.00	20.00	0.00	200.00	40.00	240.00
676	181	Formation	1.00	200.00	20.00	0.00	200.00	40.00	240.00
464	174	Consulting	1.00	300.00	20.00	0.00	300.00	60.00	360.00
679	182	Formation	1.00	100.00	20.00	0.00	100.00	20.00	120.00
603	175	Consulting	3.00	1000.00	20.00	0.00	3000.00	600.00	3600.00
604	175	Développement	1.00	500.00	20.00	0.00	500.00	100.00	600.00
605	175	Devis	1.00	50.00	20.00	0.00	50.00	10.00	60.00
407	167	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
408	167	Ligne 2	1.00	800.00	5.00	0.00	800.00	40.00	840.00
345	171	Ligne 1	1.00	100.00	20.00	0.00	100.00	20.00	120.00
347	169	Ligne 1	1.00	800.00	20.00	0.00	800.00	160.00	960.00
834	202	Formation	1.00	100.00	20.00	0.00	100.00	20.00	120.00
835	203	Formation	1.00	100.00	20.00	0.00	100.00	20.00	120.00
699	200	Formation	2.00	100.00	20.00	0.00	200.00	40.00	240.00
700	200	Redevance 	1.00	50.00	10.00	0.00	50.00	5.00	55.00
840	204	Relance	1.00	20.00	20.00	0.00	20.00	4.00	24.00
\.


--
-- Data for Name: invoice_status; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.invoice_status (id, invoice_id, status_code, status_label, created_at, client_comment) FROM stdin;
2250	189	202	Facture conforme	2025-09-19 12:06:55.179412	\N
2251	188	202	Facture conforme	2025-09-19 12:06:56.198028	\N
2252	197	203	Mise à disposition	2025-09-19 12:06:59.716082	\N
2253	201	203	Mise à disposition	2025-09-19 12:07:22.210822	\N
2254	201	211	Paiement transmis	2025-09-19 12:07:23.789633	\N
2255	200	203	Mise à disposition	2025-09-19 12:07:25.345831	\N
2256	200	204	Prise en charge	2025-09-19 12:07:27.166783	\N
2257	199	203	Mise à disposition	2025-09-19 12:07:28.845448	\N
2258	199	205	Approuvée	2025-09-19 12:07:30.178485	\N
2259	196	203	Mise à disposition	2025-09-19 12:07:33.089836	\N
2260	196	204	Prise en charge	2025-09-19 12:07:33.768369	\N
2261	195	203	Mise à disposition	2025-09-19 12:07:36.403334	\N
2262	195	206	Approuvée partiellement	2025-09-19 12:07:36.926424	Approbation partielle : montant inférieur à la facture
2263	194	203	Mise à disposition	2025-09-19 12:07:38.562084	\N
2264	194	205	Approuvée	2025-09-19 12:07:39.428583	\N
2265	191	203	Mise à disposition	2025-09-19 12:07:48.549469	\N
2266	193	400	Rejetée par le PDP	2025-09-19 12:07:49.340764	\N
2267	191	204	Prise en charge	2025-09-19 12:07:49.378533	\N
2268	192	202	Facture conforme	2025-09-19 12:07:50.459693	\N
2269	189	203	Mise à disposition	2025-09-19 12:07:51.949813	\N
2270	189	205	Approuvée	2025-09-19 12:07:52.560058	\N
2271	190	202	Facture conforme	2025-09-19 12:07:53.314154	\N
2272	189	211	Paiement transmis	2025-09-19 12:07:53.75393	\N
2273	198	202	Facture conforme	2025-09-19 12:07:54.449453	\N
2274	189	212	Encaissement constaté	2025-09-19 12:07:55.354104	\N
2275	188	203	Mise à disposition	2025-09-19 12:07:57.134694	\N
2276	188	205	Approuvée	2025-09-19 12:07:57.790356	\N
2277	201	212	Encaissement constaté	2025-09-19 12:08:15.850867	\N
2278	200	211	Paiement transmis	2025-09-19 12:08:18.423192	\N
2279	153	400	Rejetée par le PDP	2025-09-19 22:38:46.324142	\N
2280	153	202	Facture conforme	2025-09-19 22:39:15.282382	\N
2281	154	202	Facture conforme	2025-09-19 22:39:50.212498	\N
2282	154	203	Mise à disposition	2025-09-19 23:17:14.555351	\N
2283	154	204	Prise en charge	2025-09-19 23:17:23.354217	\N
2284	186	400	Rejetée par le PDP	2025-09-20 16:44:05.548802	\N
2285	182	202	Facture conforme	2025-09-20 16:44:15.382503	\N
2286	182	203	Mise à disposition	2025-09-20 16:46:41.890092	\N
2287	182	204	Prise en charge	2025-09-20 16:46:42.683275	\N
2288	182	205	Approuvée	2025-09-20 16:46:43.31092	\N
2289	182	206	Approuvée partiellement	2025-09-20 16:46:44.05629	Approbation partielle : montant inférieur à la facture
2290	182	211	Paiement transmis	2025-09-20 16:46:44.776162	\N
2291	180	202	Facture conforme	2025-09-20 16:46:53.558061	\N
2292	181	202	Facture conforme	2025-09-20 16:46:56.200817	\N
2293	182	211	Paiement transmis	2025-09-20 16:46:56.823549	\N
2294	179	202	Facture conforme	2025-09-20 16:46:58.505042	\N
2295	187	202	Facture conforme	2025-09-20 16:46:59.12112	\N
2296	181	203	Mise à disposition	2025-09-20 16:46:59.464344	\N
2297	181	204	Prise en charge	2025-09-20 16:47:00.391806	\N
2298	181	205	Approuvée	2025-09-20 16:47:01.087043	\N
2299	181	206	Approuvée partiellement	2025-09-20 16:47:01.794093	Facture validée partiellement suite contrôle manuel
2300	181	211	Paiement transmis	2025-09-20 16:47:02.406582	\N
2301	180	203	Mise à disposition	2025-09-20 16:47:03.595736	\N
2302	180	208	Suspendue	2025-09-20 16:47:04.115457	Suspension temporaire : documents manquants
2303	182	212	Encaissement constaté	2025-09-20 16:54:28.404198	\N
2304	180	208	Suspendue	2025-09-20 17:05:02.094895	Suspension temporaire : documents manquants
2238	200	202	Facture conforme	2025-09-19 12:06:42.619605	\N
2239	199	202	Facture conforme	2025-09-19 12:06:43.377881	\N
2240	198	400	Rejetée par le PDP	2025-09-19 12:06:44.191637	\N
2241	201	202	Facture conforme	2025-09-19 12:06:45.770328	\N
2242	195	202	Facture conforme	2025-09-19 12:06:46.52912	\N
2243	197	202	Facture conforme	2025-09-19 12:06:46.954542	\N
2244	196	202	Facture conforme	2025-09-19 12:06:49.735628	\N
2245	192	400	Rejetée par le PDP	2025-09-19 12:06:50.917124	\N
2246	194	202	Facture conforme	2025-09-19 12:06:51.258196	\N
2247	193	400	Rejetée par le PDP	2025-09-19 12:06:52.040273	\N
2248	190	400	Rejetée par le PDP	2025-09-19 12:06:52.424613	\N
2249	191	202	Facture conforme	2025-09-19 12:06:53.695536	\N
2305	180	208	Suspendue	2025-09-20 17:05:04.645674	Suspension temporaire : documents manquants
2306	180	208	Suspendue	2025-09-20 17:05:05.091914	Suspension temporaire : documents manquants
2307	180	208	Suspendue	2025-09-20 17:05:05.938464	Suspension temporaire : documents manquants
2308	180	208	Suspendue	2025-09-20 17:05:06.141333	Suspension temporaire : documents manquants
2309	180	208	Suspendue	2025-09-20 17:05:06.315673	Suspension temporaire : documents manquants
2310	180	400	Rejetée par le PDP	2025-09-20 17:07:26.355104	\N
2311	179	203	Mise à disposition	2025-09-20 17:07:39.030762	\N
2312	179	204	Prise en charge	2025-09-20 17:07:39.784267	\N
2313	179	206	Approuvée partiellement	2025-09-20 17:07:40.392827	Facture validée partiellement suite contrôle manuel
2314	179	211	Paiement transmis	2025-09-20 17:07:41.041861	\N
2315	179	211	Paiement transmis	2025-09-20 17:07:41.672087	\N
2316	171	202	Facture conforme	2025-09-20 17:07:55.42468	\N
2317	172	202	Facture conforme	2025-09-20 17:07:55.741733	\N
2318	169	202	Facture conforme	2025-09-20 17:07:57.451167	\N
2319	172	203	Mise à disposition	2025-09-20 17:07:58.376959	\N
2320	170	202	Facture conforme	2025-09-20 17:07:58.465665	\N
2321	172	204	Prise en charge	2025-09-20 17:07:59.129264	\N
2322	172	205	Approuvée	2025-09-20 17:07:59.859216	\N
2323	172	206	Approuvée partiellement	2025-09-20 17:08:00.591271	Facture validée partiellement suite contrôle manuel
2324	172	208	Suspendue	2025-09-20 17:08:01.197205	Facture suspendue pour vérification interne
2325	172	209	Réémission après suspension	2025-09-20 17:08:38.418378	\N
2326	202	202	Facture conforme	2025-09-23 22:29:59.888135	\N
2327	203	202	Facture conforme	2025-09-23 22:30:06.581907	\N
\.


--
-- Data for Name: invoice_taxes; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.invoice_taxes (id, invoice_id, vat_rate, base_amount, tax_amount) FROM stdin;
437	174	20.00	300.00	60.00
66	103	20.00	200.00	40.00
67	104	20.00	10.00	2.00
68	105	20.00	1000.00	200.00
69	106	20.00	100.00	20.00
70	107	20.00	100.00	20.00
71	108	20.00	100.00	20.00
72	110	20.00	10.00	2.00
73	111	20.00	10.00	2.00
74	112	20.00	10.00	2.00
75	113	20.00	10.00	2.00
76	114	20.00	10.00	2.00
77	116	20.00	100.00	20.00
78	118	20.00	10.00	2.00
79	119	20.00	100.00	20.00
80	120	20.00	10.00	2.00
81	121	20.00	100.00	20.00
82	122	20.00	10.00	2.00
571	195	20.00	100.00	20.00
573	196	20.00	500.00	100.00
83	123	20.00	10.00	2.00
380	167	5.00	800.00	40.00
381	167	20.00	100.00	20.00
582	198	20.00	500.00	100.00
583	199	20.00	50.00	10.00
84	124	20.00	200.00	40.00
85	125	20.00	1.00	0.20
86	126	20.00	0.00	0.00
87	127	20.00	10.00	2.00
88	128	20.00	10.00	2.00
89	129	20.00	1.00	0.20
90	130	20.00	1.00	0.20
91	131	20.00	1.00	0.20
92	132	20.00	1.00	0.20
93	133	20.00	1.00	0.20
94	134	20.00	1.00	0.20
95	135	20.00	1.00	0.20
96	136	20.00	1.00	0.20
318	171	20.00	100.00	20.00
585	197	20.00	200.00	40.00
320	169	20.00	800.00	160.00
586	181	20.00	200.00	40.00
102	138	20.00	10.00	2.00
104	139	20.00	800.00	160.00
105	140	20.00	1.00	0.20
106	142	20.00	1.00	0.20
107	143	20.00	1.00	0.20
108	144	20.00	2.00	0.40
64	101	20.00	100.00	20.00
110	145	20.00	10.00	2.00
111	146	5.00	20.00	1.00
112	146	20.00	100.00	20.00
113	147	10.00	100.00	10.00
114	147	20.00	1000.00	200.00
115	148	5.00	50.00	2.50
116	148	20.00	200.00	40.00
117	149	20.00	1.00	0.20
118	150	20.00	1.00	0.20
119	151	20.00	1.00	0.20
589	182	20.00	100.00	20.00
522	175	20.00	3550.00	710.00
195	163	20.00	10.00	2.00
197	164	20.00	1.00	0.20
391	173	20.00	600.00	120.00
131	155	20.00	10.00	2.00
336	172	20.00	1000.00	200.00
141	156	5.00	100.00	5.00
142	156	10.00	200.00	20.00
143	156	20.00	110.00	22.00
744	202	20.00	100.00	20.00
745	203	20.00	100.00	20.00
151	162	20.00	1.00	0.20
609	200	10.00	50.00	5.00
610	200	20.00	200.00	40.00
611	201	20.00	100.00	20.00
612	137	20.00	10.00	2.00
613	153	20.00	1.00	0.20
614	154	20.00	1.00	0.20
750	204	20.00	20.00	4.00
167	166	20.00	1.00	0.20
491	168	20.00	10.00	2.00
566	192	20.00	200.00	40.00
567	193	20.00	200.00	40.00
569	194	20.00	1200.00	240.00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.invoices (id, invoice_number, issue_date, supply_date, currency, contract_number, purchase_order_number, seller_id, client_id, seller_legal_name, subtotal, total_taxes, total, payment_terms, status, created_at, updated_at, fiscal_year, payment_method, technical_status, submission_id, last_technical_update, business_status) FROM stdin;
169	Evening_3.1         	2025-09-02	\N	EUR	\N	\N	23	43	Invoicing	800.00	160.00	960.00	30_df	draft	2025-09-02 22:10:35.001755	2025-09-20 17:07:57.449682	2025	\N	validated	sub_169_1758380869424	2025-09-20 17:07:57.445527	202
193	Refacto 0917.1      	2025-09-17	2025-09-30	EUR	M28	F43	23	27	Invoicing	200.00	40.00	240.00	30_df	draft	2025-09-17 18:51:32.522495	2025-09-19 12:07:49.339701	2025	bank_transfer	rejected	sub_193_1758276461318	2025-09-19 12:07:49.338367	400
202	PDFA3 0910.1        	2025-09-20	\N	EUR	\N	\N	23	40	Invoicing	100.00	20.00	120.00	\N	draft	2025-09-20 18:52:26.217963	2025-09-23 22:29:59.886682	2025	\N	validated	sub_202_pdf_1758659391815	2025-09-23 22:29:59.882507	202
154	Midnight0           	2025-07-28	\N	EUR	\N	\N	23	27	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-28 22:55:13.916611	2025-09-19 23:17:23.350402	2025	\N	validated	sub_154_1758314384163	2025-09-19 22:39:50.209733	204
190	Afternoon 0916.1    	2025-09-16	\N	EUR	\N	\N	23	40	Invoicing	100.00	20.00	120.00	30_df	draft	2025-09-16 18:00:53.093243	2025-09-19 12:07:53.31263	2025	bank_transfer	validated	sub_190_1758276463271	2025-09-19 12:07:53.308735	202
189	Morning 0916.2      	2025-09-16	\N	EUR	\N	\N	23	26	Invoicing	500.00	100.00	600.00	\N	draft	2025-09-16 11:39:46.6651	2025-09-19 12:07:55.350348	2025	bank_transfer	validated	sub_189_1758276405138	2025-09-19 12:06:55.173085	212
177	Night 1.1           	2025-09-06	\N	EUR	\N	\N	23	43	Invoicing	700.00	140.00	840.00	30_df	draft	2025-09-07 00:20:20.19941	2025-09-17 11:47:31.733894	2025	bank_transfer	pending		2025-09-17 11:47:31.730308	pending
201	Scope 091825.2      	2025-09-18	\N	EUR	\N	\N	23	61	Invoicing	100.00	20.00	120.00	\N	draft	2025-09-18 12:46:20.955502	2025-09-19 12:08:15.839238	2025	\N	validated	sub_201_1758276395733	2025-09-19 12:06:45.767039	212
123	2025F03             	2024-12-31	\N	EUR	\N	\N	31	\N	Invoicing	50.00	10.00	60.00	\N	draft	2025-08-26 09:11:58.492444	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
175	Afternoon 3.2       	2025-09-04	\N	EUR	\N	\N	23	43	Invoicing	3550.00	710.00	4260.00	30_df	draft	2025-09-04 13:59:24.067895	2025-09-16 11:38:21.49769	2025	bank_transfer	pending		2025-09-16 11:38:21.4939	pending
134	654651              	2027-01-01	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 09:36:17.979242	2025-08-28 09:03:44.144926	2027	\N	pending		2025-09-11 14:41:48.751637	pending
164	Morning_2.6         	2025-08-29	\N	EUR	\N	\N	23	27	Invoicing	1.00	0.20	1.20	30_df	draft	2025-08-29 09:34:10.330947	2025-08-29 21:54:02.00051	2025	\N	pending		2025-09-11 14:41:48.751637	pending
183	Morning_3.1         	2025-09-11	\N	EUR	\N	\N	38	59	Dev Journey	100.00	20.00	120.00	\N	draft	2025-09-11 09:31:07.43374	2025-09-12 14:37:17.819598	2025	\N	pending		2025-09-12 14:36:16.545181	pending
127	2025F05             	2025-08-27	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-27 08:47:58.302405	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
144	Night6              	2025-08-27	\N	EUR	\N	\N	23	27	Invoicing	2.00	0.40	2.40	\N	draft	2025-08-27 23:38:32.442475	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
125	5461                	2025-01-01	\N	EUR	\N	\N	31	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 08:44:39.504562	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
133	2025F12             	2025-01-01	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 09:25:01.979056	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
139	2025Night           	2025-08-27	\N	EUR	Marché 28	Commande 12	23	43	Invoicing	800.00	160.00	960.00	immediate	draft	2025-08-27 22:53:51.165156	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
120	156                 	2024-07-23	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 23:16:58.48087	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
131	2025F10             	2025-07-26	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 09:12:42.558214	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
110	9874                	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 17:05:20.255621	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
145	Night7              	2025-08-28	\N	EUR	\N	\N	23	28	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-28 08:41:37.072293	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
138	2025F19             	2025-01-01	\N	EUR	Contrat 12	Commande 2	23	43	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-27 19:24:19.915871	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
184	Morning_6.0         	2025-09-11	\N	EUR	\N	\N	38	59	Dev Journey	600.00	120.00	720.00	\N	draft	2025-09-11 09:48:36.365325	2025-09-12 14:33:06.878269	2025	\N	pending		2025-09-12 12:01:49.79296	pending
151	Morning5            	2025-08-28	\N	EUR	\N	\N	23	43	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-28 10:29:22.933276	2025-08-28 10:29:22.933276	2025	\N	pending		2025-09-11 14:41:48.751637	pending
203	Initial             	2025-09-22	2025-09-30	EUR	M28	C250	23	26	Invoicing	100.00	20.00	120.00	30_df	draft	2025-09-22 15:26:29.468831	2025-09-23 22:30:06.579891	2025	bank_transfer	validated	sub_203_pdf_1758659396534	2025-09-23 22:30:06.575469	202
181	Evening_4.1         	2025-09-09	\N	EUR	M282	\N	23	27	Invoicing	200.00	40.00	240.00	30_df	draft	2025-09-09 20:50:07.536216	2025-09-20 16:47:02.40265	2025	bank_transfer	validated	sub_181_1758379606158	2025-09-20 16:46:56.19453	211
172	Evening_3.4         	2025-09-02	\N	EUR	\N	\N	23	27	Invoicing	1000.00	200.00	1200.00	30_df	draft	2025-09-02 22:37:17.951991	2025-09-20 17:08:38.416887	2025	\N	validated	sub_172_1758380908378	2025-09-20 17:08:38.412955	209
197	Refacto 0917.5      	2025-10-01	2025-10-19	EUR	M28	C253	23	31	Invoicing	200.00	40.00	240.00	30_df	draft	2025-09-17 19:45:27.203516	2025-09-19 12:06:59.712361	2025	bank_transfer	validated	sub_197_1758276398923	2025-09-19 12:06:46.951762	203
126	5461                	2024-07-26	\N	EUR	\N	\N	31	\N	Invoicing	0.00	0.00	0.00	\N	draft	2025-08-27 08:45:21.17867	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
150	Morning4            	2025-08-28	\N	EUR	\N	\N	23	43	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-28 10:28:22.438402	2025-08-28 10:28:22.438402	2025	\N	pending		2025-09-11 14:41:48.751637	pending
103	dez                 	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	200.00	40.00	240.00	\N	draft	2025-08-25 14:08:09.061861	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
185	Morning_6.2         	2025-09-11	\N	EUR	\N	\N	38	59	Dev Journey	300.00	60.00	360.00	\N	draft	2025-09-11 09:55:46.788633	2025-09-12 14:37:48.604821	2025	\N	pending		2025-09-12 14:37:35.776036	pending
199	Refacto 0917.7      	2025-09-17	\N	EUR	\N	\N	23	40	Invoicing	50.00	10.00	60.00	\N	draft	2025-09-17 22:54:41.434187	2025-09-19 12:07:30.174559	2025	\N	validated	sub_199_1758276397348	2025-09-19 12:06:43.374455	205
195	Refacto 0917.3      	2025-09-17	2025-10-15	EUR	M29	C253	23	40	Invoicing	100.00	20.00	120.00	30_df	draft	2025-09-17 19:08:38.068048	2025-09-19 12:07:36.923132	2025	bank_transfer	validated	sub_195_1758276400494	2025-09-19 12:06:46.526131	206
130	2025F09             	2025-05-09	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 09:09:45.36988	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
194	Refacto 0917.2      	2025-09-17	2025-09-30	EUR	M28	C12	23	27	Invoicing	1200.00	240.00	1440.00	30_df	draft	2025-09-17 19:02:05.199223	2025-09-19 12:07:39.425034	2025	bank_transfer	validated	sub_194_1758276401222	2025-09-19 12:06:51.254203	205
187	Morning 20250916.1  	2025-09-16	\N	EUR	\N	\N	23	26	Invoicing	200.00	40.00	240.00	\N	draft	2025-09-16 09:45:46.409985	2025-09-20 16:46:59.119643	2025	\N	validated	sub_187_1758379611066	2025-09-20 16:46:59.116149	202
191	Morning 0917.1      	2025-09-17	\N	EUR	\N	\N	23	40	Invoicing	500.00	100.00	600.00	\N	draft	2025-09-17 09:38:35.840519	2025-09-19 12:07:49.377216	2025	\N	validated	sub_191_1758276403654	2025-09-19 12:06:53.690327	204
101	464                 	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-25 11:11:24.450965	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
198	Refacto 0917.6      	2025-09-17	2025-09-30	EUR	M28	C250	23	40	Invoicing	500.00	100.00	600.00	45_df	draft	2025-09-17 22:04:29.351966	2025-09-19 12:07:54.448098	2025	bank_transfer	validated	sub_198_1758276466389	2025-09-19 12:07:54.443642	202
137	2025F18             	2025-08-27	\N	EUR	\N	\N	23	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-27 19:17:01.777256	2025-09-19 22:37:55.714218	2025	\N	pending		2025-09-11 14:41:48.751637	pending
118	1                   	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 22:31:42.902459	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
204	Initial 2           	2025-09-22	\N	EUR	\N	\N	23	40	Invoicing	20.00	4.00	24.00	30_df	draft	2025-09-22 15:49:05.638885	2025-09-23 10:04:18.487629	2025	bank_transfer	pending	\N	2025-09-22 15:49:05.638885	pending
168	PDFViewer1          	2025-09-01	\N	EUR	\N	\N	23	27	Invoicing	10.00	2.00	12.00	30_df	draft	2025-08-30 18:54:31.181085	2025-09-04 18:20:17.553899	2025	\N	pending		2025-09-11 14:41:48.751637	pending
166	Morning_2.0         	2025-08-29	\N	EUR	\N	\N	23	27	Invoicing	1.00	0.20	1.20	30_df	draft	2025-08-29 09:40:19.271924	2025-08-29 18:53:11.565009	2025	\N	pending		2025-09-11 14:41:48.751637	pending
178	Afternoon 5.1       	2025-09-07	\N	EUR	\N	\N	23	43	Invoicing	200.00	40.00	240.00	30_df	draft	2025-09-07 17:35:54.652225	2025-09-17 11:47:30.593355	2025	bank_transfer	pending		2025-09-17 11:47:30.591993	pending
107	facture             	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-25 14:22:55.296108	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
186	Morning 090915      	2025-09-15	\N	EUR	\N	\N	23	26	Invoicing	100.00	20.00	120.00	\N	draft	2025-09-15 10:31:48.039369	2025-09-20 16:44:05.547263	2025	\N	rejected	sub_186_1758379437498	2025-09-20 16:44:05.542161	400
182	Evening_4.2         	2025-09-09	\N	EUR	\N	\N	23	31	Invoicing	100.00	20.00	120.00	30_df	draft	2025-09-09 21:52:39.408943	2025-09-20 16:54:28.40069	2025	bank_transfer	validated	sub_182_1758379449324	2025-09-20 16:44:15.376531	212
105	dedez               	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	1000.00	200.00	1200.00	\N	draft	2025-08-25 14:13:19.371911	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
108	tout                	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-25 14:24:32.16068	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
147	Morning1            	2025-08-28	\N	EUR	\N	\N	23	27	Invoicing	1100.00	210.00	1310.00	\N	draft	2025-08-28 09:05:58.019246	2025-08-28 09:05:58.019246	2025	\N	pending		2025-09-11 14:41:48.751637	pending
132	202511              	2025-09-28	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 09:20:17.600509	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
113	un dernier avant    	2026-09-26	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 17:16:03.345612	2025-08-28 09:03:44.144926	2026	\N	pending		2025-09-11 14:41:48.751637	pending
163	Morning_2.4         	2025-08-29	\N	EUR	\N	\N	23	27	Invoicing	10.00	2.00	12.00	30_df	draft	2025-08-29 09:30:42.875586	2025-08-29 21:53:08.71515	2025	\N	pending		2025-09-11 14:41:48.751637	pending
156	Midnight5           	2025-08-28	\N	EUR	\N	\N	23	27	Invoicing	410.00	47.00	457.00	30_df	draft	2025-08-29 00:06:40.464503	2025-08-29 08:50:10.066866	2025	\N	pending		2025-09-11 14:41:48.751637	pending
176	Night 1.0           	2025-09-06	\N	EUR	\N	\N	23	27	Invoicing	200.00	40.00	240.00	30_df	draft	2025-09-07 00:09:18.997126	2025-09-16 16:16:13.159342	2025	bank_transfer	pending		2025-09-16 16:16:08.044365	pending
174	Morning_4.1         	2025-09-03	\N	EUR	\N	\N	23	43	Invoicing	300.00	60.00	360.00	30_df	draft	2025-09-03 09:52:33.816841	2025-09-16 11:38:30.940224	2025	\N	pending		2025-09-16 11:38:30.936675	pending
116	1                   	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-25 19:14:46.114038	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
148	Morning2            	2025-08-28	\N	EUR	2025M29	2024C278	23	43	Invoicing	250.00	42.50	292.50	60_df	draft	2025-08-28 09:44:41.544434	2025-08-28 09:44:41.544434	2025	\N	pending		2025-09-11 14:41:48.751637	pending
104	974                 	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 14:09:45.420015	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
111	456                 	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 17:09:15.175338	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
129	2025F07             	2025-01-01	\N	EUR	\N	\N	31	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 09:06:26.013273	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
106	945                 	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-25 14:15:46.952981	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
128	2025F06             	2025-08-27	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-27 08:56:03.808327	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
196	Refacto 0917.4      	2025-09-17	2025-09-30	EUR	M35	C253	23	26	Invoicing	500.00	100.00	600.00	30_df	draft	2025-09-17 19:15:01.293439	2025-09-19 12:07:33.764532	2025	bank_transfer	validated	sub_196_1758276399700	2025-09-19 12:06:49.73201	204
192	Morning 0907.2      	2025-09-17	\N	EUR	\N	\N	23	40	Invoicing	200.00	40.00	240.00	\N	draft	2025-09-17 09:53:48.556129	2025-09-19 12:07:50.458473	2025	\N	validated	sub_192_1758276462429	2025-09-19 12:07:50.456916	202
188	Morning 0916.1      	2025-09-16	\N	EUR	\N	\N	23	26	Invoicing	200.00	40.00	240.00	\N	draft	2025-09-16 09:48:36.945577	2025-09-19 12:07:57.787035	2025	\N	validated	sub_188_1758276406160	2025-09-19 12:06:56.192217	205
136	27082025            	2025-08-27	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 11:32:42.312779	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
112	97485               	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 17:12:48.712208	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
200	Scope 091825.1      	2025-09-19	\N	EUR	\N	\N	23	61	Invoicing	250.00	45.00	295.00	\N	draft	2025-09-18 09:59:50.050023	2025-09-19 12:08:18.419	2025	bank_transfer	validated	sub_200_1758276396589	2025-09-19 12:06:42.616382	211
171	Evening_3.3         	2025-09-02	\N	EUR	\N	\N	23	27	Invoicing	100.00	20.00	120.00	30_df	draft	2025-09-02 22:26:25.745233	2025-09-20 17:07:55.423237	2025	\N	validated	sub_171_1758380867378	2025-09-20 17:07:55.41931	202
180	Afternoon 5.5       	2025-09-10	\N	EUR	\N	\N	23	26	Invoicing	100.00	20.00	120.00	30_df	draft	2025-09-07 19:27:28.36726	2025-09-20 17:07:26.353476	2025	bank_transfer	rejected	sub_180_1758380838319	2025-09-20 17:07:26.349699	400
170	Evening_3.2         	2025-09-02	\N	EUR	\N	\N	23	27	Invoicing	500.00	100.00	600.00	30_df	draft	2025-09-02 22:22:45.199335	2025-09-20 17:07:58.464456	2025	\N	validated	sub_170_1758380868423	2025-09-20 17:07:58.46281	202
140	Night2              	2025-08-27	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 22:55:48.543781	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
149	Morning3            	2025-08-28	\N	EUR	\N	\N	23	43	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-28 10:17:39.327323	2025-08-28 10:17:39.327323	2025	\N	pending		2025-09-11 14:41:48.751637	pending
143	Night5              	2025-08-27	\N	EUR	\N	\N	23	43	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 23:04:05.728733	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
119	F                   	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-25 23:06:01.861152	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
135	5461dez             	2025-08-27	\N	EUR	\N	\N	23	\N	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-27 10:56:22.935431	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
122	202502              	2025-07-25	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	sent	2025-08-26 09:08:42.815023	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
179	Afternoon 5.3       	2025-09-06	\N	EUR	\N	\N	23	43	Invoicing	200.00	40.00	240.00	30_df	draft	2025-09-07 18:29:07.549409	2025-09-20 17:07:41.668353	2025	bank_transfer	validated	sub_179_1758379608458	2025-09-20 16:46:58.49886	211
146	Night8              	2025-08-28	\N	EUR	2025M28	2024C278	23	43	Invoicing	120.00	21.00	141.00	\N	draft	2025-08-28 08:50:53.298895	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
155	Midnight1           	2025-08-28	2025-09-02	EUR	Marché 1	Commande 1	23	27	Invoicing	1610.00	246.00	1856.00	credit_card	draft	2025-08-28 23:08:30.718387	2025-08-29 00:04:57.199277	2025	\N	pending		2025-09-11 14:41:48.751637	pending
142	Night4              	2025-08-27	\N	EUR	Contrat 15	C12	23	\N	Invoicing	1.00	0.20	1.20	45_df	draft	2025-08-27 22:58:16.780708	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
162	Morning_2.3         	2025-08-29	\N	EUR	\N	\N	23	27	Invoicing	1.00	0.20	1.20	30_df	draft	2025-08-29 09:29:35.370461	2025-08-29 09:29:35.370461	2025	\N	pending		2025-09-11 14:41:48.751637	pending
114	Particulier         	2024-07-24	\N	EUR	\N	\N	31	\N	Invoicing	10.00	2.00	12.00	\N	draft	2025-08-25 17:29:41.184214	2025-08-28 09:03:44.144926	2024	\N	pending		2025-09-11 14:41:48.751637	pending
153	Afternoon1          	2025-08-28	\N	EUR	\N	\N	23	43	Invoicing	1.00	0.20	1.20	\N	draft	2025-08-28 17:28:15.913773	2025-09-19 22:39:15.281102	2025	\N	validated	sub_153_1758314345214	2025-09-19 22:39:15.256286	202
173	Evening_3.5         	2025-09-02	\N	EUR	\N	\N	23	43	Invoicing	600.00	120.00	720.00	30_df	draft	2025-09-02 22:41:57.509794	2025-09-15 16:47:31.54009	2025	\N	pending		2025-09-15 16:47:30.292084	pending
167	Afternoon 2.1       	2025-08-29	\N	EUR	\N	\N	23	27	Invoicing	900.00	60.00	960.00	30_df	draft	2025-08-29 18:54:51.476383	2025-09-03 21:50:48.780892	2025	\N	pending		2025-09-11 14:41:48.751637	pending
124	Hello               	2024-12-21	\N	EUR	\N	\N	31	\N	Invoicing	200.00	40.00	240.00	\N	draft	2025-08-26 10:36:28.528423	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
121	202501              	2025-07-25	\N	EUR	\N	\N	31	\N	Invoicing	100.00	20.00	120.00	\N	draft	2025-08-26 08:57:40.472313	2025-08-28 09:03:44.144926	2025	\N	pending		2025-09-11 14:41:48.751637	pending
\.


--
-- Data for Name: sellers; Type: TABLE DATA; Schema: invoicing; Owner: francois
--

COPY invoicing.sellers (id, legal_name, legal_identifier, address, city, postal_code, country_code, vat_number, registration_info, share_capital, created_at, updated_at, contact_email, phone_number, company_type, iban, bic, payment_method, payment_terms, additional_1, additional_2, auth0_id) FROM stdin;
31	Seller Moon	51240098500200	Stranger Road	Toulouse	31000	FR			\N	2025-09-09 09:40:15.548236	2025-09-09 09:40:15.548236	contact@seller.moon.fr		MICRO			\N	\N			\N
38	Dev Journey	35044656800015	Route de Revel	Toulouse	31000	FR			\N	2025-09-11 09:05:19.407829	2025-09-11 09:05:19.407829			MICRO			\N	\N			auth0|68c13b28faae94cb3ae69c40
23	Invoicing	35044656700017	Route de Narbonne	Toulouse	31000	FR	FR0000000000	RCS	1000.00	2025-08-21 15:36:07.11755	2025-09-18 10:27:11.15054	contact@invoicing.fr	0600000001	MICRO	FR7600000000000000000000000	CEPAFRPPXXX	bank_transfer	30_df	Nous vous remercions de votre confiance et restons à votre disposition pour toute information complémentaire.\n	Conditions Générales de Vente  :\nLe règlement des factures s’effectue à 30 jours fin de mois. \nTout retard de paiement donnera lieu à l’application de pénalités de retard au taux légal en vigueur, ainsi qu’à une indemnité forfaitaire pour frais de recouvrement de 40 €. \nLes biens livrés demeurent la propriété du vendeur jusqu’au paiement intégral de la facture.\n	auth0|68be9b0f13abefa8ce4866cc
\.


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.clients_id_seq', 61, true);


--
-- Name: invoice_attachments_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.invoice_attachments_id_seq', 603, true);


--
-- Name: invoice_client_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.invoice_client_id_seq', 87, true);


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.invoice_lines_id_seq', 840, true);


--
-- Name: invoice_status_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.invoice_status_id_seq', 2327, true);


--
-- Name: invoice_taxes_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.invoice_taxes_id_seq', 750, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.invoices_id_seq', 204, true);


--
-- Name: sellers_id_seq; Type: SEQUENCE SET; Schema: invoicing; Owner: francois
--

SELECT pg_catalog.setval('invoicing.sellers_id_seq', 38, true);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: invoice_attachments invoice_attachments_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_attachments
    ADD CONSTRAINT invoice_attachments_pkey PRIMARY KEY (id);


--
-- Name: invoice_client invoice_client_invoice_id_key; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_client
    ADD CONSTRAINT invoice_client_invoice_id_key UNIQUE (invoice_id);


--
-- Name: invoice_client invoice_client_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_client
    ADD CONSTRAINT invoice_client_pkey PRIMARY KEY (id);


--
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: invoice_status invoice_status_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_status
    ADD CONSTRAINT invoice_status_pkey PRIMARY KEY (id);


--
-- Name: invoice_taxes invoice_taxes_invoice_id_vat_rate_key; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_taxes
    ADD CONSTRAINT invoice_taxes_invoice_id_vat_rate_key UNIQUE (invoice_id, vat_rate);


--
-- Name: invoice_taxes invoice_taxes_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_taxes
    ADD CONSTRAINT invoice_taxes_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_auth0_id_key; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.sellers
    ADD CONSTRAINT sellers_auth0_id_key UNIQUE (auth0_id);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


--
-- Name: clients_siret_unique_idx; Type: INDEX; Schema: invoicing; Owner: francois
--

CREATE UNIQUE INDEX clients_siret_unique_idx ON invoicing.clients USING btree (siret) WHERE (is_company AND (country_code = 'FR'::bpchar) AND (siret IS NOT NULL));


--
-- Name: idx_clients_seller_id; Type: INDEX; Schema: invoicing; Owner: francois
--

CREATE INDEX idx_clients_seller_id ON invoicing.clients USING btree (seller_id);


--
-- Name: idx_invoice_status_invoice_id; Type: INDEX; Schema: invoicing; Owner: francois
--

CREATE INDEX idx_invoice_status_invoice_id ON invoicing.invoice_status USING btree (invoice_id);


--
-- Name: uniq_invoice_seller_year_number; Type: INDEX; Schema: invoicing; Owner: francois
--

CREATE UNIQUE INDEX uniq_invoice_seller_year_number ON invoicing.invoices USING btree (seller_id, fiscal_year, invoice_number);


--
-- Name: invoice_client invoice_client_sync_client_insert; Type: TRIGGER; Schema: invoicing; Owner: francois
--

CREATE TRIGGER invoice_client_sync_client_insert BEFORE INSERT ON invoicing.invoice_client FOR EACH ROW EXECUTE FUNCTION invoicing.upsert_client_from_invoice();


--
-- Name: invoice_client invoice_client_sync_client_update; Type: TRIGGER; Schema: invoicing; Owner: francois
--

CREATE TRIGGER invoice_client_sync_client_update BEFORE UPDATE ON invoicing.invoice_client FOR EACH ROW EXECUTE FUNCTION invoicing.upsert_client_from_invoice();


--
-- Name: invoice_lines invoice_lines_totals_trigger; Type: TRIGGER; Schema: invoicing; Owner: francois
--

CREATE TRIGGER invoice_lines_totals_trigger AFTER INSERT OR UPDATE ON invoicing.invoice_lines FOR EACH ROW EXECUTE FUNCTION invoicing.update_invoice_totals();


--
-- Name: invoice_lines invoice_lines_totals_trigger_delete; Type: TRIGGER; Schema: invoicing; Owner: francois
--

CREATE TRIGGER invoice_lines_totals_trigger_delete AFTER DELETE ON invoicing.invoice_lines FOR EACH ROW EXECUTE FUNCTION invoicing.update_invoice_totals();


--
-- Name: invoices prevent_delete_non_draft_trigger; Type: TRIGGER; Schema: invoicing; Owner: francois
--

CREATE TRIGGER prevent_delete_non_draft_trigger BEFORE DELETE ON invoicing.invoices FOR EACH ROW EXECUTE FUNCTION invoicing.prevent_delete_non_draft();


--
-- Name: clients clients_seller_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.clients
    ADD CONSTRAINT clients_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES invoicing.sellers(id) ON DELETE CASCADE;


--
-- Name: invoice_attachments invoice_attachments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_attachments
    ADD CONSTRAINT invoice_attachments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_client invoice_client_invoice_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_client
    ADD CONSTRAINT invoice_client_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_lines invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_lines
    ADD CONSTRAINT invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_status invoice_status_invoice_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_status
    ADD CONSTRAINT invoice_status_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_taxes invoice_taxes_invoice_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoice_taxes
    ADD CONSTRAINT invoice_taxes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES invoicing.clients(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_seller_id_fkey; Type: FK CONSTRAINT; Schema: invoicing; Owner: francois
--

ALTER TABLE ONLY invoicing.invoices
    ADD CONSTRAINT invoices_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES invoicing.sellers(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5antdCQZXfcR9hAxneHGCQ5CtKVCqR5YjO56YIbuwI8jwxgxp742ATRgX8L1WL8

