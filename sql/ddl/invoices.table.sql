-- invoicing.invoices definition

-- Drop table

-- DROP TABLE invoicing.invoices;

<<<<<<< HEAD
CREATE TABLE invoicing.invoices (
	id serial4 NOT NULL, -- Identifiant unique interne de la facture
	invoice_number bpchar(20) NOT NULL, -- Référence facture chez l’émetteur (max 20 caractères)
	issue_date date NOT NULL, -- Date d'émission de la facture
	supply_date date NULL -- Date de livraison ou prestation,
	currency bpchar(3) DEFAULT 'EUR'::bpchar NULL, -- Devise ISO 4217
	contract_number varchar(100) NULL, -- Numéro de marché / contrat (engagement)
	purchase_order_number varchar(100) NULL, -- Numéro de commande (engagement)
	seller_id int4 NOT NULL, -- Référence vers le vendeur
	client_id int4 NULL, -- Référence vers l'acheteur
	seller_legal_name varchar(255) NOT NULL -- Raison sociale du vendeur (dupliquée pour historique),
	subtotal numeric(14, 2) NULL, -- Montant HT total
	total_taxes numeric(14, 2) NULL, -- Montant total TVA
	total numeric(14, 2) NULL, -- Montant TTC total
	payment_terms text NULL, -- Conditions de paiement
	status varchar(20) DEFAULT 'draft'::character varying NULL, -- Statut (draft, final, canceled)
	created_at timestamp DEFAULT now() NULL, -- Date de création
	updated_at timestamp DEFAULT now() NULL, -- Date de mise à jour
	fiscal_year int4 NOT NULL, -- Année fiscale (année de l'émission de la facture)
	CONSTRAINT chk_fiscal_year_range CHECK (((fiscal_year >= 2000) AND (fiscal_year <= 2100))),
	CONSTRAINT chk_fiscal_year_reasonable CHECK (((fiscal_year >= ((EXTRACT(year FROM issue_date))::integer - 1)) AND (fiscal_year <= ((EXTRACT(year FROM issue_date))::integer + 1)))),
	CONSTRAINT invoices_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX uniq_invoice_seller_year_number ON invoicing.invoices USING btree (seller_id, fiscal_year, invoice_number);
=======
CREATE TABLE invoicing.invoices ( id serial4 NOT NULL, invoice_number bpchar(20) NOT NULL, issue_date date NOT NULL, supply_date date NULL, currency bpchar(3) DEFAULT 'EUR'::bpchar NULL, contract_number varchar(100) NULL, purchase_order_number varchar(100) NULL, seller_id int4 NOT NULL, client_id int4 NOT NULL, seller_legal_name varchar(255) NOT NULL, client_legal_name varchar(255) NOT NULL, subtotal numeric(14, 2) NULL, total_taxes numeric(14, 2) NULL, total numeric(14, 2) NULL, payment_terms text NULL, status varchar(20) DEFAULT 'draft'::character varying NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number), CONSTRAINT invoices_pkey PRIMARY KEY (id));
>>>>>>> 5f08e77 (Jour 13 : liste des factures frontend, helpers et tooltips, stratégie de travail avec ChatGPT)

-- Column comments

COMMENT ON COLUMN invoicing.invoices.id IS 'Identifiant unique interne de la facture';
COMMENT ON COLUMN invoicing.invoices.invoice_number IS 'Référence facture chez l’émetteur (max 20 caractères)';
COMMENT ON COLUMN invoicing.invoices.issue_date IS 'Date d''émission de la facture';
COMMENT ON COLUMN invoicing.invoices.supply_date IS 'Date de livraison ou prestation';
COMMENT ON COLUMN invoicing.invoices.currency IS 'Devise ISO 4217';
COMMENT ON COLUMN invoicing.invoices.contract_number IS 'Numéro de marché / contrat (engagement)';
COMMENT ON COLUMN invoicing.invoices.purchase_order_number IS 'Numéro de commande (engagement)';
COMMENT ON COLUMN invoicing.invoices.seller_id IS 'Référence vers le vendeur';
COMMENT ON COLUMN invoicing.invoices.client_id IS 'Référence vers l''acheteur';
COMMENT ON COLUMN invoicing.invoices.seller_legal_name IS 'Raison sociale du vendeur (dupliquée pour historique)';
COMMENT ON COLUMN invoicing.invoices.subtotal IS 'Montant HT total';
COMMENT ON COLUMN invoicing.invoices.total_taxes IS 'Montant total TVA';
COMMENT ON COLUMN invoicing.invoices.total IS 'Montant TTC total';
<<<<<<< HEAD
COMMENT ON COLUMN invoicing.invoices.payment_terms IS 'Conditions de paiement';
=======
COMMENT ON COLUMN invoicing.invoices.recovery_fee IS 'Indemnité forfaitaire de recouvrement';
>>>>>>> 5f08e77 (Jour 13 : liste des factures frontend, helpers et tooltips, stratégie de travail avec ChatGPT)
COMMENT ON COLUMN invoicing.invoices.status IS 'Statut (draft, final, canceled)';
COMMENT ON COLUMN invoicing.invoices.created_at IS 'Date de création';
COMMENT ON COLUMN invoicing.invoices.updated_at IS 'Date de mise à jour';
COMMENT ON COLUMN invoicing.invoices.fiscal_year IS 'Année fiscale (année de l''émission de la facture)';


-- invoicing.invoices foreign keys

ALTER TABLE invoicing.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES invoicing.clients(id) ON DELETE SET NULL;
ALTER TABLE invoicing.invoices ADD CONSTRAINT invoices_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES invoicing.sellers(id);