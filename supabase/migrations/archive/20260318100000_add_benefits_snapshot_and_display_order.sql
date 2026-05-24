-- Add benefits_snapshot to business_quote_items
-- Stores product features at quote creation time for historical accuracy
ALTER TABLE business_quote_items
ADD COLUMN IF NOT EXISTS benefits_snapshot JSONB DEFAULT NULL;

-- Add display_order to business_quote_terms for deterministic rendering order
ALTER TABLE business_quote_terms
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN business_quote_items.benefits_snapshot IS 'Snapshot of product features at quote creation time. Shape: { features: string[], formatted_benefits: Array<{ text, category }> }';
COMMENT ON COLUMN business_quote_terms.display_order IS 'Controls rendering order. Default terms: 1-5, product-specific: 10+';
