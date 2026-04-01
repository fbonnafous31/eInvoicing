-- 011_create_invoice_sequence_table.sql

-- Créer la table seulement si elle n'existe pas
CREATE TABLE IF NOT EXISTS invoicing.invoice_sequence (
    id serial PRIMARY KEY,
    seller_id int NOT NULL UNIQUE,  -- Une ligne par vendeur
    last_sequence int NOT NULL DEFAULT 0
);

-- Ajouter les commentaires (ils ne plantent pas si la table existe déjà)
COMMENT ON TABLE invoicing.invoice_sequence IS 'Table pour gérer la numérotation continue des factures par vendeur';
COMMENT ON COLUMN invoicing.invoice_sequence.seller_id IS 'Référence vers le vendeur';
COMMENT ON COLUMN invoicing.invoice_sequence.last_sequence IS 'Dernier numéro de facture attribué pour ce vendeur (tous exercices confondus)';

-- Créer l'index seulement si inexistant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'invoicing'
          AND tablename = 'invoice_sequence'
          AND indexname = 'idx_invoice_sequence_seller'
    ) THEN
        CREATE INDEX idx_invoice_sequence_seller ON invoicing.invoice_sequence (seller_id);
    END IF;
END
$$;