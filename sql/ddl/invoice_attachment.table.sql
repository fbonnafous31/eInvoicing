CREATE TABLE invoicing.invoice_attachments (
  id serial PRIMARY KEY,
  invoice_id int NOT NULL REFERENCES invoicing.invoices(id) ON DELETE CASCADE,
  file_name varchar(255) NOT NULL,
  file_path text NOT NULL,
  uploaded_at timestamp DEFAULT now()
);

COMMENT ON TABLE invoicing.invoice_attachments IS 'Table contenant les justificatifs liés aux factures';

COMMENT ON COLUMN invoicing.invoice_attachments.id IS 'Identifiant unique du justificatif';
COMMENT ON COLUMN invoicing.invoice_attachments.invoice_id IS 'Référence vers la facture associée';
COMMENT ON COLUMN invoicing.invoice_attachments.file_name IS 'Nom du fichier tel qu’uploadé (ex: facture-signée.pdf)';
COMMENT ON COLUMN invoicing.invoice_attachments.file_path IS 'Chemin ou URL où le fichier est stocké';
COMMENT ON COLUMN invoicing.invoice_attachments.uploaded_at IS 'Date et heure d’upload du justificatif';

