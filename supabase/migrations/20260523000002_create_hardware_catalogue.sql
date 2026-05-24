-- Migration: Create CircleTel Hardware Product Catalogue
-- Purpose: Customer-facing hardware product catalogue mapped from supplier feeds
-- Created: 2026-05-23
--
-- This bridges raw supplier_products to what customers see on circletel.co.za.
-- Products are manually curated ("promoted") from supplier feeds with:
--   - CircleTel retail pricing (cost + markup)
--   - Back-to-back T&Cs mirroring supplier warranty/return policies
--   - Service package linkage ("Pairs with SkyFibre Home")

-- =====================================================
-- TABLE 1: CircleTel Hardware Products
-- =====================================================

CREATE TABLE IF NOT EXISTS circletel_hardware_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Display
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,

  -- Pricing
  retail_price DECIMAL(10,2) NOT NULL DEFAULT 0,     -- CircleTel selling price (incl VAT)
  cost_price DECIMAL(10,2) DEFAULT 0,                 -- Best supplier cost (excl VAT)
  markup_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN cost_price > 0
      THEN ROUND(((retail_price - cost_price) / cost_price * 100), 1)
      ELSE NULL
    END
  ) STORED,

  -- Status & Display
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  -- Specs & Warranty (from supplier feed)
  specifications JSONB DEFAULT '{}'::jsonb,
  warranty_months INTEGER,
  warranty_description TEXT,

  -- Source tracking
  primary_supplier_code TEXT,                          -- Which supplier this was sourced from

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circletel_hardware_products IS 'Customer-facing hardware product catalogue curated from supplier feeds';

-- =====================================================
-- TABLE 2: Hardware Product Supplier Links
-- =====================================================

CREATE TABLE IF NOT EXISTS hardware_product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_product_id UUID NOT NULL REFERENCES circletel_hardware_products(id) ON DELETE CASCADE,
  supplier_product_id UUID NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,

  -- Cost tracking per supplier
  supplier_cost DECIMAL(10,2) NOT NULL,                -- Cost from this supplier (excl VAT)
  is_preferred BOOLEAN DEFAULT false,                  -- Primary source flag

  -- Change tracking
  last_synced_cost DECIMAL(10,2),                      -- Previous cost for change detection
  cost_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(hardware_product_id, supplier_product_id)
);

COMMENT ON TABLE hardware_product_suppliers IS 'Links CircleTel hardware products to specific supplier SKUs, tracking per-supplier costs';

-- =====================================================
-- TABLE 3: Hardware Product Terms & Conditions
-- =====================================================

CREATE TABLE IF NOT EXISTS hardware_product_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_product_id UUID NOT NULL REFERENCES circletel_hardware_products(id) ON DELETE CASCADE,

  -- T&C fields
  warranty_period TEXT,                                -- e.g., "12 months manufacturer warranty"
  return_policy TEXT,                                  -- e.g., "7-day return for defects"
  refund_policy TEXT,                                  -- e.g., "Refund within 7 days if unopened"
  delivery_estimate TEXT,                              -- e.g., "3-5 business days"
  warranty_notes TEXT,                                 -- Additional warranty details

  -- Back-to-back tracking
  is_back_to_back BOOLEAN DEFAULT true,                -- Terms mirror the supplier's
  source_supplier_code TEXT,                           -- Which supplier's terms these reflect
  source_supplier_warranty_months INTEGER,             -- Original warranty from supplier feed

  -- Versioning
  effective_from TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE hardware_product_terms IS 'T&Cs for hardware products, tracking back-to-back status with supplier terms';

-- =====================================================
-- TABLE 4: Hardware Service Package Links
-- =====================================================

CREATE TABLE IF NOT EXISTS hardware_service_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_product_id UUID NOT NULL REFERENCES circletel_hardware_products(id) ON DELETE CASCADE,
  service_package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type TEXT DEFAULT 'recommended_for' CHECK (
    relationship_type IN ('bundled_with', 'recommended_for', 'required_for')
  ),

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(hardware_product_id, service_package_id)
);

COMMENT ON TABLE hardware_service_links IS 'Links hardware products to CircleTel service packages ("Pairs with SkyFibre Home")';

-- =====================================================
-- INDEXES
-- =====================================================

-- Hardware products
CREATE INDEX IF NOT EXISTS idx_hw_products_status ON circletel_hardware_products(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_hw_products_category ON circletel_hardware_products(category);
CREATE INDEX IF NOT EXISTS idx_hw_products_slug ON circletel_hardware_products(slug);
CREATE INDEX IF NOT EXISTS idx_hw_products_featured ON circletel_hardware_products(is_featured) WHERE is_featured = true;

-- Supplier links
CREATE INDEX IF NOT EXISTS idx_hw_supplier_links_product ON hardware_product_suppliers(hardware_product_id);
CREATE INDEX IF NOT EXISTS idx_hw_supplier_links_supplier_product ON hardware_product_suppliers(supplier_product_id);
CREATE INDEX IF NOT EXISTS idx_hw_supplier_links_preferred ON hardware_product_suppliers(hardware_product_id, is_preferred) WHERE is_preferred = true;

-- Terms
CREATE INDEX IF NOT EXISTS idx_hw_terms_product ON hardware_product_terms(hardware_product_id);

-- Service links
CREATE INDEX IF NOT EXISTS idx_hw_service_links_product ON hardware_service_links(hardware_product_id);
CREATE INDEX IF NOT EXISTS idx_hw_service_links_service ON hardware_service_links(service_package_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_hw_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hw_products_timestamp ON circletel_hardware_products;
CREATE TRIGGER update_hw_products_timestamp
  BEFORE UPDATE ON circletel_hardware_products
  FOR EACH ROW EXECUTE FUNCTION update_hw_product_timestamp();

DROP TRIGGER IF EXISTS update_hw_supplier_links_timestamp ON hardware_product_suppliers;
CREATE TRIGGER update_hw_supplier_links_timestamp
  BEFORE UPDATE ON hardware_product_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_hw_product_timestamp();

DROP TRIGGER IF EXISTS update_hw_terms_timestamp ON hardware_product_terms;
CREATE TRIGGER update_hw_terms_timestamp
  BEFORE UPDATE ON hardware_product_terms
  FOR EACH ROW EXECUTE FUNCTION update_hw_product_timestamp();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE circletel_hardware_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_product_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_service_links ENABLE ROW LEVEL SECURITY;

-- Public read for published products
CREATE POLICY "Public can view published hardware products" ON circletel_hardware_products
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view hardware supplier links" ON hardware_product_suppliers
  FOR SELECT USING (true);

CREATE POLICY "Public can view hardware terms" ON hardware_product_terms
  FOR SELECT USING (true);

CREATE POLICY "Public can view hardware service links" ON hardware_service_links
  FOR SELECT USING (true);

-- Admin full access (uses existing Supabase auth)
CREATE POLICY "Admin full access hardware products" ON circletel_hardware_products
  FOR ALL USING (true);

CREATE POLICY "Admin full access hardware supplier links" ON hardware_product_suppliers
  FOR ALL USING (true);

CREATE POLICY "Admin full access hardware terms" ON hardware_product_terms
  FOR ALL USING (true);

CREATE POLICY "Admin full access hardware service links" ON hardware_service_links
  FOR ALL USING (true);

-- =====================================================
-- VIEW: Curated Product View (joins everything)
-- =====================================================

CREATE OR REPLACE VIEW v_hardware_product_detail AS
SELECT
  hp.id,
  hp.name,
  hp.slug,
  hp.description,
  hp.category,
  hp.image_url,
  hp.retail_price,
  hp.cost_price,
  hp.markup_percentage,
  hp.status,
  hp.is_featured,
  hp.sort_order,
  hp.specifications,
  hp.warranty_months,
  hp.warranty_description,
  hp.primary_supplier_code,
  hp.published_at,
  -- Best supplier cost
  MIN(hps.supplier_cost) AS best_supplier_cost,
  COUNT(hps.id) AS supplier_count,
  -- Stock across suppliers
  COALESCE(SUM(sp.stock_total), 0) AS total_stock,
  COALESCE(SUM(sp.stock_cpt), 0) AS stock_cpt,
  COALESCE(SUM(sp.stock_jhb), 0) AS stock_jhb,
  COALESCE(SUM(sp.stock_dbn), 0) AS stock_dbn,
  -- Terms
  hpt.warranty_period AS terms_warranty,
  hpt.return_policy AS terms_return,
  hpt.is_back_to_back AS terms_back_to_back
FROM circletel_hardware_products hp
LEFT JOIN hardware_product_suppliers hps ON hp.id = hps.hardware_product_id
LEFT JOIN supplier_products sp ON hps.supplier_product_id = sp.id
LEFT JOIN hardware_product_terms hpt ON hp.id = hpt.hardware_product_id
GROUP BY
  hp.id, hp.name, hp.slug, hp.description, hp.category, hp.image_url,
  hp.retail_price, hp.cost_price, hp.markup_percentage,
  hp.status, hp.is_featured, hp.sort_order,
  hp.specifications, hp.warranty_months, hp.warranty_description,
  hp.primary_supplier_code, hp.published_at,
  hpt.warranty_period, hpt.return_policy, hpt.is_back_to_back;

COMMENT ON VIEW v_hardware_product_detail IS 'Customer-facing view joining hardware products with suppliers, stock, and terms';

-- =====================================================
-- COMPLETE
-- =====================================================

-- Migration summary:
-- 1. circletel_hardware_products — curated customer-facing catalogue
-- 2. hardware_product_suppliers — per-supplier cost tracking junction
-- 3. hardware_product_terms — back-to-back T&C mirroring
-- 4. hardware_service_links — "Pairs with" service package linkage
-- 5. v_hardware_product_detail — flattened view for customer pages
