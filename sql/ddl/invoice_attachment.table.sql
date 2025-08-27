-- invoicing.invoice_attachments definition

-- Drop table

-- DROP TABLE invoicing.invoice_attachments;

CREATE TABLE invoicing.invoice_attachments (
	id serial4 NOT NULL,
	invoice_id int4 NOT NULL,
	file_name varchar(255) NOT NULL,
	file_path text NOT NULL,
	attachment_type text NOT NULL,
	uploaded_at timestamp DEFAULT now() NULL,
	CONSTRAINT invoice_attachments_pkey PRIMARY KEY (id),
	CONSTRAINT invoice_attachments_type_check CHECK ((attachment_type = ANY (ARRAY[('main'::character varying)::text, ('additional'::character varying)::text])))
);


-- invoicing.invoice_attachments foreign keys

ALTER TABLE invoicing.invoice_attachments ADD CONSTRAINT invoice_attachments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoicing.invoices(id) ON DELETE CASCADE;