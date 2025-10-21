-- invoicing.seller_smtp_settings definition

-- Drop table

-- DROP TABLE invoicing.seller_smtp_settings;

CREATE TABLE invoicing.seller_smtp_settings (
	id serial4 NOT NULL,
	seller_id int4 NOT NULL, -- Référence vers le vendeur propriétaire de cette configuration.
	smtp_host varchar(255) NOT NULL, -- Nom d’hôte du serveur SMTP (ex : smtp.gmail.com).
	smtp_port int4 DEFAULT 587 NOT NULL, -- Port du serveur SMTP (généralement 465 ou 587).
	smtp_secure bool DEFAULT false NULL, -- Indique si la connexion utilise SSL/TLS.
	smtp_user varchar(255) NOT NULL, -- Nom d’utilisateur ou adresse e-mail utilisée pour l’authentification SMTP.
	smtp_pass varchar(255) NOT NULL, -- Mot de passe ou token d’application chiffré pour le compte SMTP.
	smtp_from varchar(255) NOT NULL, -- Adresse e-mail utilisée dans le champ From des messages envoyés.
	active bool DEFAULT true NULL, -- Indique si cette configuration SMTP est active.
	created_at timestamp DEFAULT now() NOT NULL, -- Date de création de la configuration SMTP.
	updated_at timestamp DEFAULT now() NOT NULL, -- Date de dernière mise à jour.
	CONSTRAINT seller_smtp_settings_pkey PRIMARY KEY (id)
);

-- Column comments

COMMENT ON COLUMN invoicing.seller_smtp_settings.seller_id IS 'Référence vers le vendeur propriétaire de cette configuration.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.smtp_host IS 'Nom d’hôte du serveur SMTP (ex : smtp.gmail.com).';
COMMENT ON COLUMN invoicing.seller_smtp_settings.smtp_port IS 'Port du serveur SMTP (généralement 465 ou 587).';
COMMENT ON COLUMN invoicing.seller_smtp_settings.smtp_secure IS 'Indique si la connexion utilise SSL/TLS.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.smtp_user IS 'Nom d’utilisateur ou adresse e-mail utilisée pour l’authentification SMTP.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.smtp_pass IS 'Mot de passe ou token d’application chiffré pour le compte SMTP.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.smtp_from IS 'Adresse e-mail utilisée dans le champ From des messages envoyés.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.active IS 'Indique si cette configuration SMTP est active.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.created_at IS 'Date de création de la configuration SMTP.';
COMMENT ON COLUMN invoicing.seller_smtp_settings.updated_at IS 'Date de dernière mise à jour.';


-- invoicing.seller_smtp_settings foreign keys

ALTER TABLE invoicing.seller_smtp_settings ADD CONSTRAINT seller_smtp_settings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES invoicing.sellers(id) ON DELETE CASCADE;