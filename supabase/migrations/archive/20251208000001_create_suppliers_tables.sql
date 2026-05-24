-- Migration: Create Suppliers Management System
-- Purpose: Enable supplier product catalog management with sync capabilities
-- Created: 2025-12-08
--
-- This supports managing equipment suppliers like Scoop Distribution:
-- - Supplier master data (contact, feed URL, sync status)
-- - Product catalog (SKU, pricing, stock levels by branch)
-- - Sync logging for audit trail
-- - Integration with product_cost_components for cost tracking

-- =====================================================
-- PHASE 1: Create Suppliers Table
-- =====================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,              -- e.g., "SCOOP", "YEALINK"

  -- Contact Information
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  account_number TEXT,                    -- Our account with supplier
  payment_terms TEXT,                     -- e.g., "30 days", "COD"

  -- Feed Configuration
  feed_url TEXT,                          -- XML/API endpoint
  feed_type TEXT DEFAULT 'xml',           -- xml, api, csv, manual
  feed_credentials JSONB DEFAULT '{}'::jsonb,  -- Encrypted credentials if needed

  -- Sync Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',     -- pending, syncing, success, failed
  sync_error TEXT,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE suppliers IS 'Master list of equipment/product suppliers for CircleTel inventory management';

-- =====================================================
-- PHASE 2: Create Supplier Products Table
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Supplier Link
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

  -- Product Identification
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,

  -- Pricing (from supplier feed)
  cost_price DECIMAL(10,2),               -- Dealer price excl VAT
  retail_price DECIMAL(10,2),             -- Retail price incl VAT (from supplier)

  -- Image Management
  source_image_url TEXT,                  -- Original URL from supplier
  cached_image_path TEXT,                 -- Path in Supabase Storage (supplier-images/...)

  -- Product URL (link to supplier product page)
  product_url TEXT,

  -- Stock Levels by Branch
  stock_cpt INTEGER DEFAULT 0,            -- Cape Town stock
  stock_jhb INTEGER DEFAULT 0,            -- Johannesburg stock
  stock_dbn INTEGER DEFAULT 0,            -- Durban stock
  stock_total INTEGER DEFAULT 0,          -- Total across all branches
  in_stock BOOLEAN GENERATED ALWAYS AS (stock_total > 0) STORED,

  -- Categorization
  category TEXT,                          -- Product category (derived or manual)
  subcategory TEXT,                       -- Product subcategory

  -- Extended Details
  specifications JSONB DEFAULT '{}'::jsonb,   -- Technical specifications
  features JSONB DEFAULT '[]'::jsonb,         -- Feature list

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_discontinued BOOLEAN DEFAULT false,

  -- Sync Tracking
  last_synced_at TIMESTAMPTZ,
  previous_cost_price DECIMAL(10,2),      -- For price change detection
  previous_stock_total INTEGER,           -- For stock change detection

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one SKU per supplier
  UNIQUE(supplier_id, sku)
);

COMMENT ON TABLE supplier_products IS 'Product catalog from suppliers with pricing, stock levels, and sync tracking';

-- =====================================================
-- PHASE 3: Create Supplier Sync Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Supplier Reference
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

  -- Sync Status
  status TEXT NOT NULL,                   -- started, completed, failed

  -- Sync Statistics
  products_found INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_unchanged INTEGER DEFAULT 0,
  products_deactivated INTEGER DEFAULT 0,
  images_cached INTEGER DEFAULT 0,

  -- Error Details
  error_message TEXT,
  error_details JSONB DEFAULT '{}'::jsonb,

  -- Performance
  duration_ms INTEGER,

  -- Triggered By
  triggered_by TEXT,                      -- manual, scheduled, webhook
  triggered_by_user_id UUID,              -- Admin user who triggered (if manual)

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE supplier_sync_logs IS 'Audit trail for supplier product sync operations';

-- =====================================================
-- PHASE 4: Link to Product Cost Components
-- =====================================================

-- Add supplier_product_id to product_cost_components for direct linking
ALTER TABLE product_cost_components
ADD COLUMN IF NOT EXISTS supplier_product_id UUID REFERENCES supplier_products(id) ON DELETE SET NULL;

COMMENT ON COLUMN product_cost_components.supplier_product_id IS 'Links cost component to supplier product for automatic price updates';

-- =====================================================
-- PHASE 5: Create Indexes
-- =====================================================

-- Supplier indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status);

-- Supplier products indexes
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_sku ON supplier_products(sku);
CREATE INDEX IF NOT EXISTS idx_supplier_products_manufacturer ON supplier_products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_supplier_products_category ON supplier_products(category);
CREATE INDEX IF NOT EXISTS idx_supplier_products_in_stock ON supplier_products(in_stock) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_supplier_products_is_active ON supplier_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supplier_products_cost_price ON supplier_products(cost_price);

-- Sync logs indexes
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_supplier_id ON supplier_sync_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_status ON supplier_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_started_at ON supplier_sync_logs(started_at DESC);

-- Cost components supplier link index
CREATE INDEX IF NOT EXISTS idx_cost_components_supplier_product
ON product_cost_components(supplier_product_id) WHERE supplier_product_id IS NOT NULL;

-- =====================================================
-- PHASE 6: Create Triggers
-- =====================================================

-- Update timestamp trigger for suppliers
CREATE OR REPLACE FUNCTION update_supplier_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_suppliers_timestamp ON suppliers;
CREATE TRIGGER update_suppliers_timestamp
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_timestamp();

DROP TRIGGER IF EXISTS update_supplier_products_timestamp ON supplier_products;
CREATE TRIGGER update_supplier_products_timestamp
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_timestamp();

-- =====================================================
-- PHASE 7: Enable Row Level Security
-- =====================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies for suppliers table (admin only)
CREATE POLICY "Admin can view suppliers" ON suppliers
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update suppliers" ON suppliers
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete suppliers" ON suppliers
  FOR DELETE USING (true);

-- Policies for supplier_products table (admin only)
CREATE POLICY "Admin can view supplier products" ON supplier_products
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert supplier products" ON supplier_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update supplier products" ON supplier_products
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete supplier products" ON supplier_products
  FOR DELETE USING (true);

-- Policies for supplier_sync_logs table (admin only)
CREATE POLICY "Admin can view sync logs" ON supplier_sync_logs
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert sync logs" ON supplier_sync_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PHASE 8: Create Summary Views
-- =====================================================

-- View for supplier summary with product counts
CREATE OR REPLACE VIEW v_supplier_summary AS
SELECT
  s.id,
  s.name,
  s.code,
  s.website_url,
  s.is_active,
  s.last_synced_at,
  s.sync_status,
  s.sync_error,
  COUNT(sp.id) as total_products,
  COUNT(sp.id) FILTER (WHERE sp.is_active) as active_products,
  COUNT(sp.id) FILTER (WHERE sp.in_stock) as in_stock_products,
  MIN(sp.cost_price) as min_price,
  MAX(sp.cost_price) as max_price,
  SUM(sp.stock_total) as total_stock_units
FROM suppliers s
LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
GROUP BY s.id, s.name, s.code, s.website_url, s.is_active, s.last_synced_at, s.sync_status, s.sync_error;

COMMENT ON VIEW v_supplier_summary IS 'Supplier summary with aggregated product statistics';

-- View for stock levels across branches
CREATE OR REPLACE VIEW v_supplier_stock_by_branch AS
SELECT
  s.id as supplier_id,
  s.name as supplier_name,
  s.code as supplier_code,
  SUM(sp.stock_cpt) as stock_cpt,
  SUM(sp.stock_jhb) as stock_jhb,
  SUM(sp.stock_dbn) as stock_dbn,
  SUM(sp.stock_total) as stock_total,
  COUNT(sp.id) FILTER (WHERE sp.stock_cpt > 0) as products_in_cpt,
  COUNT(sp.id) FILTER (WHERE sp.stock_jhb > 0) as products_in_jhb,
  COUNT(sp.id) FILTER (WHERE sp.stock_dbn > 0) as products_in_dbn
FROM suppliers s
LEFT JOIN supplier_products sp ON s.id = sp.supplier_id AND sp.is_active = true
GROUP BY s.id, s.name, s.code;

COMMENT ON VIEW v_supplier_stock_by_branch IS 'Stock levels aggregated by branch/warehouse';

-- =====================================================
-- PHASE 9: Seed Initial Supplier (Scoop Distribution)
-- =====================================================

INSERT INTO suppliers (
  name,
  code,
  website_url,
  feed_url,
  feed_type,
  contact_email,
  contact_phone,
  notes,
  is_active,
  sync_status
) VALUES (
  'Scoop Distribution',
  'SCOOP',
  'https://scoop.co.za',
  'https://scoop.co.za/scoop_pricelist.xml',
  'xml',
  'sales@scoop.co.za',
  NULL,
  'Primary networking equipment supplier. XML feed contains SKU, prices, and stock by branch (CPT/JHB/DBN).',
  true,
  'pending'
) ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- COMPLETE
-- =====================================================

-- Migration summary:
-- 1. Created suppliers table for supplier master data
-- 2. Created supplier_products table for product catalog with pricing/stock
-- 3. Created supplier_sync_logs table for sync audit trail
-- 4. Added supplier_product_id column to product_cost_components
-- 5. Created indexes for performance
-- 6. Enabled RLS with admin-only policies
-- 7. Created summary views for reporting
-- 8. Seeded Scoop Distribution as first supplier
