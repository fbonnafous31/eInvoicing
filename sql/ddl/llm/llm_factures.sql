CREATE SCHEMA IF NOT EXISTS llm;

DROP VIEW IF EXISTS llm.llm_factures;

-- Puis recréer la vue
CREATE VIEW llm.llm_factures AS
SELECT
    f.id AS invoice_id,
    f.invoice_number,
    f.issue_date,
    f.supply_date,
    f.currency,
    f.contract_number,
    f.purchase_order_number,
    f.status AS invoice_status,
    f.payment_terms,
    f.payment_method,
    f.subtotal,
    f.total_taxes,
    f.total,
    f.fiscal_year,
    s.id AS seller_id,
    s.legal_name AS seller_name,
    c.id AS client_id,
    c.legal_name AS client_name,
    COALESCE(
        json_agg(
            json_build_object(
                'description', il.description,
                'quantity', il.quantity,
                'unit_price', il.unit_price,
                'vat_rate', il.vat_rate,
                'discount', il.discount,
                'line_net', il.line_net,
                'line_tax', il.line_tax,
                'line_total', il.line_total
            )
        ) FILTER (WHERE il.id IS NOT NULL),
        '[]'
    ) AS invoice_lines,
    COALESCE(
        json_agg(
            json_build_object(
                'vat_rate', it.vat_rate,
                'base_amount', it.base_amount,
                'tax_amount', it.tax_amount
            )
        ) FILTER (WHERE it.id IS NOT NULL),
        '[]'
    ) AS invoice_taxes,
    COALESCE(
        json_agg(
            json_build_object(
                'status_code', ist.status_code,
                'status_label', ist.status_label,
                'created_at', ist.created_at,
                'client_comment', ist.client_comment
            )
        ) FILTER (WHERE ist.id IS NOT NULL),
        '[]'
    ) AS invoice_status_history
FROM invoicing.invoices f
JOIN invoicing.sellers s ON f.seller_id = s.id
LEFT JOIN invoicing.clients c ON f.client_id = c.id
LEFT JOIN invoicing.invoice_lines il ON il.invoice_id = f.id
LEFT JOIN invoicing.invoice_taxes it ON it.invoice_id = f.id
LEFT JOIN invoicing.invoice_status ist ON ist.invoice_id = f.id
GROUP BY f.id, s.id, s.legal_name, c.id, c.legal_name;
