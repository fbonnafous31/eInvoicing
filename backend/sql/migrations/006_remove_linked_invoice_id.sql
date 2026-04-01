-- 006_remove_linked_invoice_id.sql
-- Migration pour supprimer la colonne linked_invoice_id qui ne sera plus utilisée

-- Vérifie si la colonne existe avant suppression pour éviter les erreurs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND column_name = 'linked_invoice_id'
    ) THEN
        ALTER TABLE invoicing.invoices
        DROP COLUMN linked_invoice_id;
        RAISE NOTICE 'Colonne linked_invoice_id supprimée.';
    ELSE
        RAISE NOTICE 'Colonne linked_invoice_id inexistante, rien à faire.';
    END IF;
END
$$;