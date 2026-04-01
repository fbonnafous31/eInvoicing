-- 1️⃣ Suppression de l'ancien index
DROP INDEX IF EXISTS invoicing.idx_invoices_original_invoice_id;

-- 2️⃣ Modification du type de la colonne seulement si nécessaire
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND column_name = 'original_invoice_id') = 'uuid' THEN
        ALTER TABLE invoicing.invoices
        ALTER COLUMN original_invoice_id TYPE integer
        USING original_invoice_id::text::integer;
        RAISE NOTICE 'Type de original_invoice_id modifié de UUID vers INTEGER';
    ELSE
        RAISE NOTICE 'original_invoice_id n''est pas UUID, rien à faire';
    END IF;
END
$$;

-- 3️⃣ Création de l'index si il n'existe pas
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
        RAISE NOTICE 'Index idx_invoices_original_invoice_id créé';
    ELSE
        RAISE NOTICE 'Index idx_invoices_original_invoice_id existe déjà';
    END IF;
END
$$;

-- 4️⃣ Ajout de la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND constraint_name = 'fk_original_invoice'
    ) THEN
        ALTER TABLE invoicing.invoices
        ADD CONSTRAINT fk_original_invoice
        FOREIGN KEY (original_invoice_id)
        REFERENCES invoicing.invoices(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'FK fk_original_invoice ajoutée';
    ELSE
        RAISE NOTICE 'FK fk_original_invoice existe déjà';
    END IF;
END
$$;