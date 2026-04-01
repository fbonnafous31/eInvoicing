-- 009_add_cancelled_fields.sql
-- Ajoute les champs pour tracer les annulations de facture

ALTER TABLE invoicing.invoices
  ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN cancel_reason VARCHAR(255) NULL;

-- Ajouter les commentaires séparément
COMMENT ON COLUMN invoices.cancelled_at IS 'Date d’annulation de la facture';
COMMENT ON COLUMN invoices.cancel_reason IS 'Motif de l’annulation';

-- Optionnel : créer un index sur cancelled_at pour faciliter les recherches/audits
CREATE INDEX idx_invoices_cancelled_at ON invoices(cancelled_at);