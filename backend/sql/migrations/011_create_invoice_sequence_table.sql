-- 011_create_invoice_sequence_table.sql
-- Table pour gérer la numérotation continue des factures par vendeur (tous exercices confondus)

CREATE TABLE invoicing.invoice_sequence (
    id serial PRIMARY KEY,
    seller_id int NOT NULL UNIQUE,  -- Une ligne par vendeur
    last_sequence int NOT NULL DEFAULT 0
);

COMMENT ON TABLE invoicing.invoice_sequence IS 'Table pour gérer la numérotation continue des factures par vendeur';
COMMENT ON COLUMN invoicing.invoice_sequence.seller_id IS 'Référence vers le vendeur';
COMMENT ON COLUMN invoicing.invoice_sequence.last_sequence IS 'Dernier numéro de facture attribué pour ce vendeur (tous exercices confondus)';

-- Index utile pour retrouver rapidement la séquence par vendeur
CREATE INDEX idx_invoice_sequence_seller ON invoicing.invoice_sequence (seller_id);