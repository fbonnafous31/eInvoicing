-- invoicing.invoices definition

-- Drop table

-- DROP TABLE invoicing.invoices;

CREATE TABLE invoicing.invoices ( id serial4 NOT NULL, invoice_number bpchar(20) NOT NULL, issue_date date NOT NULL, supply_date date NULL, currency bpchar(3) DEFAULT 'EUR'::bpchar NULL, contract_number varchar(100) NULL, purchase_order_number varchar(100) NULL, quotation_reference varchar(100) NULL, seller_id int4 NOT NULL, client_id int4 NOT NULL, seller_legal_name varchar(255) NOT NULL, client_legal_name varchar(255) NOT NULL, subtotal numeric(14, 2) NULL, total_taxes numeric(14, 2) NULL, total numeric(14, 2) NULL, payment_terms text NULL, late_fee_rate numeric(5, 2) NULL, recovery_fee numeric(14, 2) DEFAULT 40.00 NULL, status varchar(20) DEFAULT 'draft'::character varying NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number), CONSTRAINT invoices_pkey PRIMARY KEY (id));

-- Column comments

COMMENT ON COLUMN invoicing.invoices.id IS 'Identifiant unique interne de la facture';
COMMENT ON COLUMN invoicing.invoices.invoice_number IS 'Référence facture chez l’émetteur (max 20 caractères)';
COMMENT ON COLUMN invoicing.invoices.issue_date IS 'Date d''émission de la facture';
COMMENT ON COLUMN invoicing.invoices.supply_date IS 'Date de livraison ou prestation';
COMMENT ON COLUMN invoicing.invoices.currency IS 'Devise ISO 4217';
COMMENT ON COLUMN invoicing.invoices.contract_number IS 'Numéro de marché / contrat (engagement)';
COMMENT ON COLUMN invoicing.invoices.purchase_order_number IS 'Numéro de commande (engagement)';
COMMENT ON COLUMN invoicing.invoices.quotation_reference IS 'Référence devis ou contrat';
COMMENT ON COLUMN invoicing.invoices.seller_id IS 'Référence vers le vendeur';
COMMENT ON COLUMN invoicing.invoices.client_id IS 'Référence vers l''acheteur';
COMMENT ON COLUMN invoicing.invoices.seller_legal_name IS 'Raison sociale du vendeur (dupliquée pour historique)';
COMMENT ON COLUMN invoicing.invoices.client_legal_name IS 'Raison sociale de l''acheteur (dupliquée pour historique)';
COMMENT ON COLUMN invoicing.invoices.subtotal IS 'Montant HT total';
COMMENT ON COLUMN invoicing.invoices.total_taxes IS 'Montant total TVA';
COMMENT ON COLUMN invoicing.invoices.total IS 'Montant TTC total';
COMMENT ON COLUMN invoicing.invoices.payment_terms IS 'Conditions de paiement';
COMMENT ON COLUMN invoicing.invoices.late_fee_rate IS 'Taux pénalités retard (%)';
COMMENT ON COLUMN invoicing.invoices.recovery_fee IS 'Indemnité forfaitaire de recouvrement';
COMMENT ON COLUMN invoicing.invoices.status IS 'Statut (draft, final, canceled)';
COMMENT ON COLUMN invoicing.invoices.created_at IS 'Date de création';
COMMENT ON COLUMN invoicing.invoices.updated_at IS 'Date de mise à jour';


-- invoicing.invoices foreign keys

ALTER TABLE invoicing.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES invoicing.clients(id);
ALTER TABLE invoicing.invoices ADD CONSTRAINT invoices_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES invoicing.sellers(id);