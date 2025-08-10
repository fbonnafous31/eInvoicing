-- Table sellers
CREATE TABLE sellers (
    id SERIAL PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    legal_identifier VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) DEFAULT 'FR',
    vat_number VARCHAR(50),
    registration_info TEXT,
    share_capital NUMERIC(14,2),
    bank_details TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

COMMENT ON COLUMN sellers.id IS 'Identifiant unique interne du vendeur';
COMMENT ON COLUMN sellers.legal_name IS 'Raison sociale';
COMMENT ON COLUMN sellers.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN sellers.address IS 'Adresse complète';
COMMENT ON COLUMN sellers.city IS 'Ville';
COMMENT ON COLUMN sellers.postal_code IS 'Code postal';
COMMENT ON COLUMN sellers.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN sellers.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN sellers.registration_info IS 'Informations d''enregistrement (ex: RCS, registre du commerce)';
COMMENT ON COLUMN sellers.share_capital IS 'Capital social';
COMMENT ON COLUMN sellers.bank_details IS 'Détails bancaires (IBAN, BIC)';
COMMENT ON COLUMN sellers.created_at IS 'Date de création';
COMMENT ON COLUMN sellers.updated_at IS 'Date de mise à jour';

-- Table buyers
CREATE TABLE buyers (
    id SERIAL PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    legal_identifier VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) DEFAULT 'FR',
    vat_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

COMMENT ON COLUMN buyers.id IS 'Identifiant unique interne de l''acheteur';
COMMENT ON COLUMN buyers.legal_name IS 'Raison sociale';
COMMENT ON COLUMN buyers.legal_identifier IS 'Identifiant légal (ex : SIRET, VAT ID)';
COMMENT ON COLUMN buyers.address IS 'Adresse complète';
COMMENT ON COLUMN buyers.city IS 'Ville';
COMMENT ON COLUMN buyers.postal_code IS 'Code postal';
COMMENT ON COLUMN buyers.country_code IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN buyers.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN buyers.created_at IS 'Date de création';
COMMENT ON COLUMN buyers.updated_at IS 'Date de mise à jour';

-- Table invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number CHAR(20) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    supply_date DATE,
    currency CHAR(3) DEFAULT 'EUR',
    contract_number VARCHAR(100),
    purchase_order_number VARCHAR(100),
    quotation_reference VARCHAR(100),
    seller_id INT NOT NULL REFERENCES sellers(id),
    buyer_id INT NOT NULL REFERENCES buyers(id),
    seller_legal_name VARCHAR(255) NOT NULL,
    buyer_legal_name VARCHAR(255) NOT NULL,
    subtotal NUMERIC(14,2),
    total_taxes NUMERIC(14,2),
    total NUMERIC(14,2),
    payment_terms TEXT,
    late_fee_rate NUMERIC(5,2),
    recovery_fee NUMERIC(14,2) DEFAULT 40.00,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

COMMENT ON COLUMN invoices.id IS 'Identifiant unique interne de la facture';
COMMENT ON COLUMN invoices.invoice_number IS 'Référence facture chez l’émetteur (max 20 caractères)';
COMMENT ON COLUMN invoices.issue_date IS 'Date d''émission de la facture';
COMMENT ON COLUMN invoices.supply_date IS 'Date de livraison ou prestation';
COMMENT ON COLUMN invoices.currency IS 'Devise ISO 4217';
COMMENT ON COLUMN invoices.contract_number IS 'Numéro de marché / contrat (engagement)';
COMMENT ON COLUMN invoices.purchase_order_number IS 'Numéro de commande (engagement)';
COMMENT ON COLUMN invoices.quotation_reference IS 'Référence devis ou contrat';
COMMENT ON COLUMN invoices.seller_id IS 'Référence vers le vendeur';
COMMENT ON COLUMN invoices.buyer_id IS 'Référence vers l''acheteur';
COMMENT ON COLUMN invoices.seller_legal_name IS 'Raison sociale du vendeur (dupliquée pour historique)';
COMMENT ON COLUMN invoices.buyer_legal_name IS 'Raison sociale de l''acheteur (dupliquée pour historique)';
COMMENT ON COLUMN invoices.subtotal IS 'Montant HT total';
COMMENT ON COLUMN invoices.total_taxes IS 'Montant total TVA';
COMMENT ON COLUMN invoices.total IS 'Montant TTC total';
COMMENT ON COLUMN invoices.payment_terms IS 'Conditions de paiement';
COMMENT ON COLUMN invoices.late_fee_rate IS 'Taux pénalités retard (%)';
COMMENT ON COLUMN invoices.recovery_fee IS 'Indemnité forfaitaire de recouvrement';
COMMENT ON COLUMN invoices.status IS 'Statut (draft, final, canceled)';
COMMENT ON COLUMN invoices.created_at IS 'Date de création';
COMMENT ON COLUMN invoices.updated_at IS 'Date de mise à jour';

-- Table invoice_lines
CREATE TABLE invoice_lines (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    vat_rate NUMERIC(5,2) NOT NULL,
    discount NUMERIC(14,2) DEFAULT 0,
    line_net NUMERIC(14,2),
    line_tax NUMERIC(14,2),
    line_total NUMERIC(14,2)
);

COMMENT ON COLUMN invoice_lines.id IS 'Identifiant unique de la ligne';
COMMENT ON COLUMN invoice_lines.invoice_id IS 'Référence vers la facture';
COMMENT ON COLUMN invoice_lines.description IS 'Description de la ligne';
COMMENT ON COLUMN invoice_lines.quantity IS 'Quantité';
COMMENT ON COLUMN invoice_lines.unit_price IS 'Prix unitaire HT';
COMMENT ON COLUMN invoice_lines.vat_rate IS 'Taux TVA en pourcentage';
COMMENT ON COLUMN invoice_lines.discount IS 'Remise éventuelle';
COMMENT ON COLUMN invoice_lines.line_net IS 'Montant HT après remise';
COMMENT ON COLUMN invoice_lines.line_tax IS 'Montant TVA ligne';
COMMENT ON COLUMN invoice_lines.line_total IS 'Montant TTC ligne';

-- Table invoice_taxes
CREATE TABLE invoice_taxes (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    vat_rate NUMERIC(5,2) NOT NULL,
    base_amount NUMERIC(14,2) NOT NULL,
    tax_amount NUMERIC(14,2) NOT NULL,
    UNIQUE(invoice_id, vat_rate)
);

COMMENT ON COLUMN invoice_taxes.id IS 'Identifiant unique de l’assiette';
COMMENT ON COLUMN invoice_taxes.invoice_id IS 'Référence vers la facture';
COMMENT ON COLUMN invoice_taxes.vat_rate IS 'Taux TVA';
COMMENT ON COLUMN invoice_taxes.base_amount IS 'Base HT (assiette)';
COMMENT ON COLUMN invoice_taxes.tax_amount IS 'Montant TVA';
