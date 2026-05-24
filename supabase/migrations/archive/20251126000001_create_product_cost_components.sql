-- Migration: Create Product Cost Components System
-- Purpose: Enable detailed cost breakdown for products (wholesale, infrastructure, platform, hardware, etc.)
-- Created: 2025-11-26
-- 
-- This supports the cost structure shown in the SMB Essential pricing spreadsheet:
-- - MTN Wholesale (provider cost)
-- - Static IP (add-on service)
-- - Infrastructure (BNG, backhaul, CGNAT)
-- - Platform (AgilityGIS BSS)
-- - Business Router (amortised hardware)
-- - Email hosting, Cloud backup, Enhanced support
-- - Installation (amortised)

-- =====================================================
-- PHASE 1: Create Cost Component Types
-- =====================================================

-- Cost component category enum
CREATE TYPE cost_component_category AS ENUM (
  'provider',           -- Wholesale/provider costs (MTN, Vumatel, etc.)
  'infrastructure',     -- Network infrastructure (BNG, backhaul, CGNAT)
  'platform',           -- Software/platform fees (BSS, billing systems)
  'hardware',           -- Routers, CPE, equipment
  'addon_service',      -- Add-on services (Static IP, email, backup)
  'support',            -- Support packages
  'installation',       -- Installation/setup costs
  'licensing',          -- Software licenses (Microsoft 365, etc.)
  'other'               -- Miscellaneous costs
);

-- Cost recurrence type enum
CREATE TYPE cost_recurrence_type AS ENUM (
  'monthly',            -- Monthly recurring cost
  'once_off',           -- One-time cost (not amortised)
  'amortised',          -- One-time cost spread over months
  'annual',             -- Annual cost (divided by 12 for monthly)
  'per_user',           -- Per-user monthly cost
  'per_device'          -- Per-device monthly cost
);

-- =====================================================
-- PHASE 2: Create Cost Components Table
-- =====================================================

CREATE TABLE IF NOT EXISTS product_cost_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to product
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  
  -- Component identification
  name TEXT NOT NULL,                                    -- e.g., "MTN Wholesale", "Static IP"
  category cost_component_category NOT NULL DEFAULT 'other',
  
  -- Cost details
  cost_amount NUMERIC(10,2) NOT NULL DEFAULT 0,          -- Base cost amount
  recurrence cost_recurrence_type NOT NULL DEFAULT 'monthly',
  
  -- Amortisation settings (for hardware, installation)
  amortisation_months INTEGER,                           -- e.g., 12 for router over 12 months
  amortised_monthly_cost NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN recurrence = 'amortised' AND amortisation_months > 0 
      THEN ROUND(cost_amount / amortisation_months, 2)
      WHEN recurrence = 'annual'
      THEN ROUND(cost_amount / 12, 2)
      ELSE cost_amount
    END
  ) STORED,
  
  -- Per-unit costs (for per_user, per_device)
  unit_count INTEGER DEFAULT 1,                          -- Number of users/devices
  
  -- Supplier/vendor information
  supplier_name TEXT,                                    -- e.g., "MTN", "Echo/IP", "Reyee"
  supplier_reference TEXT,                               -- Supplier product code/reference
  
  -- Hardware details (for hardware category)
  hardware_model TEXT,                                   -- e.g., "Reyee RG-EG105GW(T)"
  hardware_retail_value NUMERIC(10,2),                   -- Retail price (e.g., R1,550 incl VAT)
  hardware_dealer_cost NUMERIC(10,2),                    -- Dealer cost (e.g., R1,150 excl VAT)
  
  -- Notes and details
  description TEXT,                                      -- Detailed description
  notes TEXT,                                            -- Internal notes (e.g., "July 2025 rate")
  
  -- Display settings
  sort_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,                     -- Can customer opt out?
  is_visible_to_customer BOOLEAN DEFAULT false,          -- Show in customer-facing breakdown?
  
  -- Metadata for flexibility
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 3: Create Cost Component Templates
-- =====================================================

-- Templates for common cost structures by product type
CREATE TABLE IF NOT EXISTS cost_component_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  name TEXT NOT NULL,                                    -- e.g., "SMB Fibre Package", "Cloud Hosting"
  description TEXT,
  
  -- Applicability
  product_category TEXT,                                 -- connectivity, it_services, cloud_hosting, etc.
  service_type TEXT,                                     -- SkyFibre, BizFibreConnect, Cloud_Services, etc.
  customer_type TEXT,                                    -- consumer, smme, enterprise
  
  -- Template components (JSONB array)
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
    Example structure:
    [
      {
        "name": "Provider Wholesale",
        "category": "provider",
        "recurrence": "monthly",
        "description": "Wholesale connectivity cost from provider",
        "is_required": true
      },
      {
        "name": "Static IP",
        "category": "addon_service",
        "recurrence": "monthly",
        "default_cost": 50.00,
        "supplier_name": "Echo/IP",
        "is_optional": true
      },
      {
        "name": "Business Router",
        "category": "hardware",
        "recurrence": "amortised",
        "amortisation_months": 12,
        "is_optional": false
      }
    ]
  */
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 4: Create Summary View
-- =====================================================

-- View for total cost calculation per product
CREATE OR REPLACE VIEW v_product_cost_summary AS
SELECT 
  package_id,
  COUNT(*) as component_count,
  
  -- Monthly costs breakdown
  SUM(CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE 0 END) as direct_monthly_cost,
  SUM(CASE WHEN recurrence = 'amortised' THEN amortised_monthly_cost ELSE 0 END) as amortised_monthly_cost,
  SUM(CASE WHEN recurrence = 'annual' THEN amortised_monthly_cost ELSE 0 END) as annual_monthly_cost,
  SUM(CASE WHEN recurrence IN ('per_user', 'per_device') THEN cost_amount * unit_count ELSE 0 END) as unit_monthly_cost,
  
  -- Total monthly cost
  SUM(
    CASE 
      WHEN recurrence = 'monthly' THEN cost_amount
      WHEN recurrence IN ('amortised', 'annual') THEN amortised_monthly_cost
      WHEN recurrence IN ('per_user', 'per_device') THEN cost_amount * unit_count
      ELSE 0
    END
  ) as total_monthly_cost,
  
  -- Once-off costs
  SUM(CASE WHEN recurrence = 'once_off' THEN cost_amount ELSE 0 END) as total_once_off_cost,
  
  -- Hardware totals
  SUM(CASE WHEN category = 'hardware' THEN hardware_retail_value ELSE 0 END) as total_hardware_retail,
  SUM(CASE WHEN category = 'hardware' THEN hardware_dealer_cost ELSE 0 END) as total_hardware_dealer,
  
  -- Category breakdowns
  SUM(CASE WHEN category = 'provider' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as provider_cost,
  
  SUM(CASE WHEN category = 'infrastructure' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as infrastructure_cost,
  
  SUM(CASE WHEN category = 'platform' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as platform_cost,
  
  SUM(CASE WHEN category = 'hardware' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as hardware_cost,
  
  SUM(CASE WHEN category = 'addon_service' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as addon_service_cost,
  
  SUM(CASE WHEN category = 'support' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as support_cost,
  
  SUM(CASE WHEN category = 'installation' THEN 
    CASE WHEN recurrence = 'monthly' THEN cost_amount ELSE amortised_monthly_cost END 
  ELSE 0 END) as installation_cost

FROM product_cost_components
GROUP BY package_id;

COMMENT ON VIEW v_product_cost_summary IS 'Aggregated cost summary per product for margin calculations';

-- =====================================================
-- PHASE 5: Create Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_cost_components_package_id 
  ON product_cost_components(package_id);

CREATE INDEX IF NOT EXISTS idx_product_cost_components_category 
  ON product_cost_components(category);

CREATE INDEX IF NOT EXISTS idx_product_cost_components_recurrence 
  ON product_cost_components(recurrence);

CREATE INDEX IF NOT EXISTS idx_cost_component_templates_product_category 
  ON cost_component_templates(product_category);

CREATE INDEX IF NOT EXISTS idx_cost_component_templates_service_type 
  ON cost_component_templates(service_type);

-- =====================================================
-- PHASE 6: Create Triggers
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_cost_component_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_cost_components_timestamp ON product_cost_components;
CREATE TRIGGER update_product_cost_components_timestamp
  BEFORE UPDATE ON product_cost_components
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_component_timestamp();

DROP TRIGGER IF EXISTS update_cost_component_templates_timestamp ON cost_component_templates;
CREATE TRIGGER update_cost_component_templates_timestamp
  BEFORE UPDATE ON cost_component_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_component_timestamp();

-- =====================================================
-- PHASE 7: Insert Default Templates
-- =====================================================

INSERT INTO cost_component_templates (name, description, product_category, service_type, customer_type, components) VALUES

-- SMB/Business Fibre Template
('SMB Fibre Package', 'Standard cost structure for SMB fibre packages', 'connectivity', 'BizFibreConnect', 'business', 
'[
  {"name": "Provider Wholesale", "category": "provider", "recurrence": "monthly", "description": "Wholesale connectivity from network provider", "is_required": true, "sort_order": 1},
  {"name": "Static IP", "category": "addon_service", "recurrence": "monthly", "default_cost": 50.00, "supplier_name": "Echo/IP", "description": "Static IP address", "is_optional": true, "sort_order": 2},
  {"name": "Infrastructure", "category": "infrastructure", "recurrence": "monthly", "default_cost": 35.00, "description": "BNG, backhaul, CGNAT", "is_required": true, "sort_order": 3},
  {"name": "Platform (BSS)", "category": "platform", "recurrence": "monthly", "default_cost": 10.96, "supplier_name": "AgilityGIS", "description": "BSS platform fee", "is_required": true, "sort_order": 4},
  {"name": "Business Router", "category": "hardware", "recurrence": "amortised", "amortisation_months": 12, "description": "CPE router amortised over contract", "is_optional": false, "sort_order": 5},
  {"name": "Email Hosting", "category": "addon_service", "recurrence": "monthly", "default_cost": 50.00, "description": "Business email accounts", "is_optional": true, "sort_order": 6},
  {"name": "Cloud Backup", "category": "addon_service", "recurrence": "monthly", "default_cost": 30.00, "description": "Cloud backup service", "is_optional": true, "sort_order": 7},
  {"name": "Enhanced Support", "category": "support", "recurrence": "monthly", "default_cost": 150.00, "description": "Business hours support", "is_optional": true, "sort_order": 8},
  {"name": "Installation", "category": "installation", "recurrence": "amortised", "amortisation_months": 12, "default_cost": 2500.00, "description": "Installation fee amortised", "is_optional": false, "sort_order": 9}
]'::jsonb),

-- Residential Fibre Template
('Residential Fibre Package', 'Standard cost structure for home fibre packages', 'connectivity', 'HomeFibreConnect', 'consumer',
'[
  {"name": "Provider Wholesale", "category": "provider", "recurrence": "monthly", "description": "Wholesale connectivity from network provider", "is_required": true, "sort_order": 1},
  {"name": "Infrastructure", "category": "infrastructure", "recurrence": "monthly", "default_cost": 25.00, "description": "Network infrastructure", "is_required": true, "sort_order": 2},
  {"name": "Platform (BSS)", "category": "platform", "recurrence": "monthly", "default_cost": 8.50, "supplier_name": "AgilityGIS", "description": "BSS platform fee", "is_required": true, "sort_order": 3},
  {"name": "Router", "category": "hardware", "recurrence": "once_off", "description": "Customer router (once-off or rental)", "is_optional": true, "sort_order": 4},
  {"name": "Installation", "category": "installation", "recurrence": "once_off", "default_cost": 1500.00, "description": "Standard installation", "is_optional": false, "sort_order": 5}
]'::jsonb),

-- SkyFibre (Fixed Wireless) Template
('SkyFibre Package', 'Cost structure for SkyFibre fixed wireless packages', 'connectivity', 'SkyFibre', 'consumer',
'[
  {"name": "MTN Wholesale", "category": "provider", "recurrence": "monthly", "description": "MTN wholesale connectivity rate", "is_required": true, "sort_order": 1},
  {"name": "Infrastructure", "category": "infrastructure", "recurrence": "monthly", "default_cost": 35.00, "description": "BNG, backhaul, CGNAT", "is_required": true, "sort_order": 2},
  {"name": "Platform (BSS)", "category": "platform", "recurrence": "monthly", "default_cost": 10.96, "supplier_name": "AgilityGIS", "description": "BSS platform fee", "is_required": true, "sort_order": 3},
  {"name": "CPE Router", "category": "hardware", "recurrence": "amortised", "amortisation_months": 12, "description": "Wireless CPE amortised", "is_optional": false, "sort_order": 4},
  {"name": "Installation", "category": "installation", "recurrence": "amortised", "amortisation_months": 12, "default_cost": 2500.00, "description": "Installation amortised", "is_optional": false, "sort_order": 5}
]'::jsonb),

-- Cloud & Hosting Template
('Cloud Hosting Package', 'Cost structure for cloud hosting services', 'it_services', 'Cloud_Services', NULL,
'[
  {"name": "Cloud Infrastructure", "category": "provider", "recurrence": "monthly", "description": "Cloud provider costs (AWS/Azure/GCP)", "is_required": true, "sort_order": 1},
  {"name": "Licensing", "category": "licensing", "recurrence": "monthly", "description": "Software licenses", "is_optional": true, "sort_order": 2},
  {"name": "Backup Storage", "category": "addon_service", "recurrence": "monthly", "description": "Backup storage costs", "is_optional": true, "sort_order": 3},
  {"name": "Management Platform", "category": "platform", "recurrence": "monthly", "description": "Management/monitoring tools", "is_required": true, "sort_order": 4},
  {"name": "Support Hours", "category": "support", "recurrence": "monthly", "description": "Included support hours", "is_optional": true, "sort_order": 5}
]'::jsonb),

-- IT Managed Services Template
('IT Managed Services Package', 'Cost structure for managed IT services', 'it_services', 'IT_Support', NULL,
'[
  {"name": "RMM Platform", "category": "platform", "recurrence": "per_device", "description": "Remote monitoring & management per device", "is_required": true, "sort_order": 1},
  {"name": "Antivirus/EDR", "category": "licensing", "recurrence": "per_device", "description": "Security software per device", "is_required": true, "sort_order": 2},
  {"name": "Backup Agent", "category": "addon_service", "recurrence": "per_device", "description": "Backup agent per device", "is_optional": true, "sort_order": 3},
  {"name": "Microsoft 365", "category": "licensing", "recurrence": "per_user", "description": "Microsoft 365 licenses", "is_optional": true, "sort_order": 4},
  {"name": "Help Desk", "category": "support", "recurrence": "monthly", "description": "Help desk service allocation", "is_required": true, "sort_order": 5},
  {"name": "Onsite Support", "category": "support", "recurrence": "monthly", "description": "Onsite visit allocation", "is_optional": true, "sort_order": 6}
]'::jsonb),

-- VoIP Template
('VoIP Package', 'Cost structure for VoIP services', 'connectivity', 'VoIP', NULL,
'[
  {"name": "SIP Trunk", "category": "provider", "recurrence": "monthly", "description": "SIP trunk provider cost", "is_required": true, "sort_order": 1},
  {"name": "DID Numbers", "category": "addon_service", "recurrence": "monthly", "description": "DID number rental", "is_optional": true, "sort_order": 2},
  {"name": "PBX Platform", "category": "platform", "recurrence": "per_user", "description": "Cloud PBX per extension", "is_required": true, "sort_order": 3},
  {"name": "IP Phones", "category": "hardware", "recurrence": "amortised", "amortisation_months": 24, "description": "IP handsets amortised", "is_optional": true, "sort_order": 4}
]'::jsonb)

ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 8: Enable RLS
-- =====================================================

ALTER TABLE product_cost_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_component_templates ENABLE ROW LEVEL SECURITY;

-- Admin can manage all cost components
CREATE POLICY "Admin can manage cost components" ON product_cost_components
  FOR ALL USING (true);

CREATE POLICY "Admin can manage templates" ON cost_component_templates
  FOR ALL USING (true);

-- =====================================================
-- COMPLETE
-- =====================================================

COMMENT ON TABLE product_cost_components IS 
  'Detailed cost breakdown for products. Supports monthly, once-off, amortised, and per-unit costs.
   Links to service_packages via package_id. Used for margin analysis and pricing decisions.';

COMMENT ON TABLE cost_component_templates IS
  'Predefined cost component templates for different product types.
   Helps standardize cost structures across similar products.';
