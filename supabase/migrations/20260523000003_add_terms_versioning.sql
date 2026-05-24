-- Migration: Hardware Product Terms Versioning & Supplier T&C Templates
-- Purpose: Track terms history, auto-detect supplier term changes, 
--          and support back-to-back terms mirroring with audit trail.
-- Created: 2026-05-23

-- =====================================================
-- TABLE 1: Hardware Terms History (versioning)
-- =====================================================

CREATE TABLE IF NOT EXISTS hardware_product_terms_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to terms record
  hardware_product_id UUID NOT NULL REFERENCES circletel_hardware_products(id) ON DELETE CASCADE,

  -- Snapshot of terms at this version
  warranty_period TEXT,
  return_policy TEXT,
  refund_policy TEXT,
  delivery_estimate TEXT,
  warranty_notes TEXT,
  is_back_to_back BOOLEAN DEFAULT true,
  source_supplier_code TEXT,
  source_supplier_warranty_months INTEGER,

  -- Change tracking
  version INTEGER NOT NULL DEFAULT 1,
  change_description TEXT,                  -- What changed from previous version
  changed_by TEXT,                          -- 'system', 'admin', or user ID
  
  effective_from TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE hardware_product_terms_history IS 'Versioned audit trail of hardware product terms changes';

-- =====================================================
-- TABLE 2: Supplier Default Terms Templates
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_default_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to supplier
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- Default terms extracted from supplier T&C docs
  default_warranty_period TEXT,             -- e.g., "12 months manufacturer warranty"
  default_return_policy TEXT,               -- e.g., "7-day return for defects (RMA required)"
  default_refund_policy TEXT,               -- e.g., "Refund within 7 days if unopened"
  default_delivery_estimate TEXT,           -- e.g., "2-5 business days in major centres"
  
  -- Legal disclaimers
  legal_disclaimer TEXT,                    -- e.g., "E&OE. Prices subject to change..."
  vat_note TEXT,                            -- e.g., "All prices exclude VAT"
  stock_note TEXT,                          -- e.g., "Stock levels are indicative only"
  
  -- Source
  source_document TEXT,                     -- Where these were extracted from
  extracted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(supplier_id)
);

COMMENT ON TABLE supplier_default_terms IS 'Default T&C templates extracted from supplier legal documents for back-to-back mirroring';

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_hw_terms_history_product 
  ON hardware_product_terms_history(hardware_product_id, version DESC);
  
CREATE INDEX IF NOT EXISTS idx_supplier_default_terms_supplier 
  ON supplier_default_terms(supplier_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_supplier_terms_timestamp ON supplier_default_terms;
CREATE TRIGGER update_supplier_terms_timestamp
  BEFORE UPDATE ON supplier_default_terms
  FOR EACH ROW EXECUTE FUNCTION update_hw_product_timestamp();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE hardware_product_terms_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_default_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view terms history" ON hardware_product_terms_history
  FOR SELECT USING (true);

CREATE POLICY "Admin full access terms history" ON hardware_product_terms_history
  FOR ALL USING (true);

CREATE POLICY "Public can view supplier terms templates" ON supplier_default_terms
  FOR SELECT USING (true);

CREATE POLICY "Admin full access supplier terms templates" ON supplier_default_terms
  FOR ALL USING (true);

-- =====================================================
-- SEED: Supplier Default Terms
-- =====================================================

-- Rectron terms (extracted from DISCLAIMER sheet in their xlsm)
INSERT INTO supplier_default_terms (
  supplier_id,
  default_warranty_period,
  default_return_policy,
  default_refund_policy,
  default_delivery_estimate,
  legal_disclaimer,
  vat_note,
  stock_note,
  source_document
)
SELECT 
  id,
  'Varies by product (see warranty column). Manufacturer warranty applies.',
  '7-day return for defects with RMA. RMA valid for 5 days from issue. Items must be returned in original condition with packaging, documentation, warranty cards, manuals, and accessories.',
  'Defective items may be returned for refund or replacement. Software and consumables non-refundable unless unopened. Certain hardware and custom/special orders may only be returned for replacement.',
  '48-hour lead time to major centres, 72 hours to outlying areas.',
  'Rectron (PTY) LTD will not be held liable for any injury, loss, expense or damage suffered or incurred by any person who downloads, accesses, uses or relies on the Pricelist. All pricing excludes VAT. Pricing & specifications subject to change without prior notice. Ruling rate of exchange applies. Errors & Omissions Excepted (E&OE).',
  'All pricing excludes VAT',
  'Stock levels not provided in price list. Contact Rectron for availability.',
  'RECTRON_PRICE_LIST_20260520_0749.xlsm DISCLAIMER sheet'
FROM suppliers WHERE code = 'RECTRON'
ON CONFLICT (supplier_id) DO UPDATE SET
  default_warranty_period = EXCLUDED.default_warranty_period,
  default_return_policy = EXCLUDED.default_return_policy,
  default_refund_policy = EXCLUDED.default_refund_policy,
  default_delivery_estimate = EXCLUDED.default_delivery_estimate,
  legal_disclaimer = EXCLUDED.legal_disclaimer,
  vat_note = EXCLUDED.vat_note,
  stock_note = EXCLUDED.stock_note,
  updated_at = NOW();

-- =====================================================
-- FUNCTION: Auto-version terms on update
-- =====================================================

CREATE OR REPLACE FUNCTION trg_terms_version_on_update()
RETURNS TRIGGER AS $$
DECLARE
  change_desc TEXT;
  next_version INTEGER;
BEGIN
  -- Determine what changed
  change_desc := '';
  IF NEW.warranty_period IS DISTINCT FROM OLD.warranty_period THEN
    change_desc := change_desc || 'warranty_period changed; ';
  END IF;
  IF NEW.return_policy IS DISTINCT FROM OLD.return_policy THEN
    change_desc := change_desc || 'return_policy changed; ';
  END IF;
  IF NEW.refund_policy IS DISTINCT FROM OLD.refund_policy THEN
    change_desc := change_desc || 'refund_policy changed; ';
  END IF;
  IF NEW.delivery_estimate IS DISTINCT FROM OLD.delivery_estimate THEN
    change_desc := change_desc || 'delivery_estimate changed; ';
  END IF;
  IF NEW.is_back_to_back IS DISTINCT FROM OLD.is_back_to_back THEN
    change_desc := change_desc || 'back-to-back status changed; ';
  END IF;

  -- Only create history if something meaningful changed
  IF change_desc != '' THEN
    -- Get next version
    SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
    FROM hardware_product_terms_history
    WHERE hardware_product_id = NEW.hardware_product_id;

    -- Insert history record
    INSERT INTO hardware_product_terms_history (
      hardware_product_id,
      warranty_period,
      return_policy,
      refund_policy,
      delivery_estimate,
      warranty_notes,
      is_back_to_back,
      source_supplier_code,
      source_supplier_warranty_months,
      version,
      change_description,
      changed_by,
      effective_from
    ) VALUES (
      NEW.hardware_product_id,
      OLD.warranty_period,
      OLD.return_policy,
      OLD.refund_policy,
      OLD.delivery_estimate,
      OLD.warranty_notes,
      OLD.is_back_to_back,
      OLD.source_supplier_code,
      OLD.source_supplier_warranty_months,
      next_version,
      trim(change_desc),
      'system',
      OLD.effective_from
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_terms_versioning ON hardware_product_terms;
CREATE TRIGGER trigger_terms_versioning
  BEFORE UPDATE ON hardware_product_terms
  FOR EACH ROW EXECUTE FUNCTION trg_terms_version_on_update();

-- =====================================================
-- COMPLETE
-- =====================================================

-- Migration summary:
-- 1. hardware_product_terms_history — versioned audit trail
-- 2. supplier_default_terms — T&C templates per supplier
-- 3. Auto-versioning trigger on hardware_product_terms updates
-- 4. Seeded Rectron terms from their DISCLAIMER sheet
