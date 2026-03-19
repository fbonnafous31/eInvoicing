-- 008_fix_original_invoice_id_type.sql

-- 1️⃣ Suppression de l'ancien index qui repose sur le type UUID
DROP INDEX IF EXISTS invoicing.idx_invoices_original_invoice_id;

-- 2️⃣ Modification du type de la colonne : de UUID vers INTEGER
-- On utilise le cast vers text puis vers integer pour éviter les erreurs de conversion
ALTER TABLE invoicing.invoices 
ALTER COLUMN original_invoice_id TYPE integer 
USING original_invoice_id::text::integer;

-- 3️⃣ Recréation de l'index sur le nouveau type integer
CREATE INDEX idx_invoices_original_invoice_id
ON invoicing.invoices(original_invoice_id);

-- 4️⃣ Ajout de la contrainte de clé étrangère (recommandé car les types correspondent maintenant)
ALTER TABLE invoicing.invoices
ADD CONSTRAINT fk_original_invoice
FOREIGN KEY (original_invoice_id) REFERENCES invoicing.invoices(id)
ON DELETE SET NULL;