-- 010_add_invoice_sequence_number.sql

-- 1️⃣ Ajouter la colonne seulement si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'invoicing'
          AND table_name = 'invoices'
          AND column_name = 'invoice_sequence_number'
    ) THEN
        ALTER TABLE invoicing.invoices
        ADD COLUMN invoice_sequence_number INT NULL;
        RAISE NOTICE 'Colonne invoice_sequence_number ajoutée';
    ELSE
        RAISE NOTICE 'Colonne invoice_sequence_number existe déjà';
    END IF;
END
$$;

-- 2️⃣ Ajouter le commentaire (ne plante pas si la colonne existe)
COMMENT ON COLUMN invoicing.invoices.invoice_sequence_number IS 'Numérotation continue interne pour les factures (non applicable aux devis)';

-- 3️⃣ Remplir les valeurs existantes seulement si elles ne sont pas déjà remplies
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id) AS seq
  FROM invoicing.invoices
  WHERE invoice_type != 'quote'
)
UPDATE invoicing.invoices i
SET invoice_sequence_number = o.seq
FROM ordered o
WHERE i.id = o.id
  AND i.invoice_sequence_number IS NULL;