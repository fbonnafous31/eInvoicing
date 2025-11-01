CREATE TABLE invoicing.invoice_status (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoicing.invoices(id) ON DELETE CASCADE,
    status_code INT NOT NULL, -- Code du statut (ex : 200, 201, ...)
    status_label VARCHAR(100) NOT NULL, -- Libellé du statut (ex : Déposée, Reçue, Approuvée)
    created_at TIMESTAMP DEFAULT now() NOT NULL -- Date de création du statut
);

-- Index pour accélérer la recherche par facture
CREATE INDEX idx_invoice_status_invoice_id ON invoicing.invoice_status(invoice_id);

-- Commentaires
COMMENT ON TABLE invoicing.invoice_status IS 'Historique des statuts liés au cycle de vie des factures (PDP)';
COMMENT ON COLUMN invoicing.invoice_status.id IS 'Identifiant unique interne du statut';
COMMENT ON COLUMN invoicing.invoice_status.invoice_id IS 'Référence vers la facture concernée';
COMMENT ON COLUMN invoicing.invoice_status.status_code IS 'Code du statut remonté par le PDP (200, 201, ... )';
COMMENT ON COLUMN invoicing.invoice_status.status_label IS 'Libellé du statut correspondant';
COMMENT ON COLUMN invoicing.invoice_status.created_at IS 'Date et heure d’enregistrement du statut';
