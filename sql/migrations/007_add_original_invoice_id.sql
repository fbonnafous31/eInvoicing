-- 1️⃣ Ajout de la colonne original_invoice_id
ALTER TABLE invoicing.invoices
ADD COLUMN original_invoice_id uuid NULL;

-- 2️⃣ Création d'un index pour accélérer les recherches par original_invoice_id
CREATE INDEX idx_invoices_original_invoice_id
ON invoicing.invoices(original_invoice_id);

-- 3️⃣ Optionnel : clé étrangère pour garantir l'intégrité (décommenter si besoin)
-- ALTER TABLE invoicing.invoices
-- ADD CONSTRAINT fk_original_invoice
-- FOREIGN KEY (original_invoice_id) REFERENCES invoicing.invoices(id)
-- ON DELETE SET NULL;