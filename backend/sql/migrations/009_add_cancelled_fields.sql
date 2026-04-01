-- 009_add_cancelled_fields.sql

-- 1️⃣ Ajouter les colonnes seulement si elles n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE invoicing.invoices
        ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL;
        RAISE NOTICE 'Colonne cancelled_at ajoutée';
    ELSE
        RAISE NOTICE 'Colonne cancelled_at existe déjà';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND column_name = 'cancel_reason'
    ) THEN
        ALTER TABLE invoicing.invoices
        ADD COLUMN cancel_reason VARCHAR(255) NULL;
        RAISE NOTICE 'Colonne cancel_reason ajoutée';
    ELSE
        RAISE NOTICE 'Colonne cancel_reason existe déjà';
    END IF;
END
$$;

-- 2️⃣ Ajouter les commentaires seulement si la colonne existe
COMMENT ON COLUMN invoicing.invoices.cancelled_at IS 'Date d’annulation de la facture';
COMMENT ON COLUMN invoicing.invoices.cancel_reason IS 'Motif de l’annulation';

-- 3️⃣ Créer l'index si il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'invoicing'
          AND tablename = 'invoices'
          AND indexname = 'idx_invoices_cancelled_at'
    ) THEN
        CREATE INDEX idx_invoices_cancelled_at
        ON invoicing.invoices(cancelled_at);
        RAISE NOTICE 'Index idx_invoices_cancelled_at créé';
    ELSE
        RAISE NOTICE 'Index idx_invoices_cancelled_at existe déjà';
    END IF;
END
$$;