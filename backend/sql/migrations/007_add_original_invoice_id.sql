-- 1️⃣ Ajout de la colonne original_invoice_id si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND column_name = 'original_invoice_id'
    ) THEN
        ALTER TABLE invoicing.invoices
        ADD COLUMN original_invoice_id uuid NULL;
        RAISE NOTICE 'Colonne original_invoice_id ajoutée.';
    ELSE
        RAISE NOTICE 'Colonne original_invoice_id existe déjà, rien à faire.';
    END IF;
END
$$;

-- 2️⃣ Création de l'index si il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'invoicing'
          AND tablename = 'invoices'
          AND indexname = 'idx_invoices_original_invoice_id'
    ) THEN
        CREATE INDEX idx_invoices_original_invoice_id
        ON invoicing.invoices(original_invoice_id);
        RAISE NOTICE 'Index idx_invoices_original_invoice_id créé.';
    ELSE
        RAISE NOTICE 'Index idx_invoices_original_invoice_id existe déjà, rien à faire.';
    END IF;
END
$$;

-- 3️⃣ Optionnel : clé étrangère pour garantir l'intégrité
-- ALTER TABLE invoicing.invoices
-- ADD CONSTRAINT fk_original_invoice
-- FOREIGN KEY (original_invoice_id) REFERENCES invoicing.invoices(id)
-- ON DELETE SET NULL;