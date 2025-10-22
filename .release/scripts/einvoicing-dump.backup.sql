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

