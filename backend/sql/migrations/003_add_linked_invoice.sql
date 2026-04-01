-- Ajout de la colonne (idempotent)
ALTER TABLE invoicing.invoices
ADD COLUMN IF NOT EXISTS linked_invoice_id INTEGER;

-- Ajout de la contrainte si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_linked_invoice'
    ) THEN
        ALTER TABLE invoicing.invoices
        ADD CONSTRAINT fk_linked_invoice
        FOREIGN KEY (linked_invoice_id)
        REFERENCES invoicing.invoices(id);
    END IF;
END
$$;