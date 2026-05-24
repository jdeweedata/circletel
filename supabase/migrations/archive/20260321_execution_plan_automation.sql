-- =============================================================================
-- Sales Engine: Execution Plan Automation
-- Adds tables for bootstrap execution plan tracking, product wholesale costs,
-- and dynamic scoring configuration.
-- =============================================================================

-- 1. Execution Milestones — tracks plan targets vs actuals by month
CREATE TABLE IF NOT EXISTS execution_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL CHECK (phase IN ('bootstrap', 'scale', 'expand')),
  month_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  target_mrr NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_customers INTEGER NOT NULL DEFAULT 0,
  target_products TEXT[] NOT NULL DEFAULT '{}',
  actual_mrr NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_customers INTEGER NOT NULL DEFAULT 0,
  msc_commitment NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'met', 'at_risk', 'missed')),
  hiring_trigger TEXT,
  notes TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(month_number)
);

-- 2. Product Wholesale Costs — tracks wholesale vs retail for margin calculation
CREATE TABLE IF NOT EXISTS product_wholesale_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  service_package_id UUID,
  wholesale_provider TEXT NOT NULL,
  wholesale_mrc NUMERIC(10,2) NOT NULL,
  wholesale_nrc NUMERIC(10,2) DEFAULT 0,
  retail_price NUMERIC(10,2) NOT NULL,
  gross_margin_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN retail_price > 0
    THEN ROUND(((retail_price - wholesale_mrc) / retail_price * 100)::numeric, 2)
    ELSE 0 END
  ) STORED,
  notes TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sales Engine Config — dynamic scoring configuration store
CREATE TABLE IF NOT EXISTS sales_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system'
);

-- =============================================================================
-- Seed: Execution Milestones (from Bootstrap Execution Plan v1.0)
-- Plan start date: April 2026 (Month 1)
-- =============================================================================

INSERT INTO execution_milestones (phase, month_number, label, target_mrr, target_customers, target_products, msc_commitment, hiring_trigger, period_start, period_end) VALUES
  ('bootstrap', 1,  'Phase 1: Activate first 10 SkyFibre SMB customers', 22000, 10, '{SkyFibre SMB,ClinicConnect}', 0, NULL, '2026-04-01', '2026-04-30'),
  ('bootstrap', 2,  'Phase 1: Scale to 25 customers + Unjani rollout', 55000, 25, '{SkyFibre SMB,ClinicConnect}', 0, NULL, '2026-05-01', '2026-05-31'),
  ('bootstrap', 3,  'Phase 1: R119K MRR — begin DUNE pilot prep', 119000, 45, '{SkyFibre SMB,ClinicConnect}', 0, NULL, '2026-06-01', '2026-06-30'),
  ('scale', 4,      'Phase 2: MSC kicks in — R14,970/mo commitment', 184000, 70, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT}', 14970, NULL, '2026-07-01', '2026-07-31'),
  ('scale', 5,      'Phase 2: First DUNE park deployed', 254000, 95, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT}', 14970, NULL, '2026-08-01', '2026-08-31'),
  ('scale', 6,      'Phase 2: R349K MRR — hire Sales Rep 1', 349000, 125, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT}', 14970, 'Hire Sales Rep 1 (R350K MRR sustained 2mo)', '2026-09-01', '2026-09-30'),
  ('expand', 7,     'Phase 3: MSC escalates — R29,940/mo', 449000, 155, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT,CloudWiFi WaaS}', 29940, NULL, '2026-10-01', '2026-10-31'),
  ('expand', 8,     'Phase 3: R564K MRR — hire Technician', 564000, 190, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT,CloudWiFi WaaS,BizFibreConnect}', 29940, 'Hire Technical Installer (R500K MRR sustained 2mo)', '2026-11-01', '2026-11-30'),
  ('expand', 9,     'Phase 3: 100 SkyFibre SMB customers', 694000, 230, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT,CloudWiFi WaaS,BizFibreConnect}', 29940, NULL, '2026-12-01', '2026-12-31'),
  ('expand', 10,    'Phase 3: MSC escalates — R49,900/mo', 829000, 270, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT,CloudWiFi WaaS,BizFibreConnect}', 49900, 'Hire Sales Rep 2 (R750K MRR sustained 2mo)', '2027-01-01', '2027-01-31'),
  ('expand', 11,    'Phase 3: Scale to 315 customers', 974000, 315, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT,CloudWiFi WaaS,BizFibreConnect}', 49900, NULL, '2027-02-01', '2027-02-28'),
  ('expand', 12,    'Phase 3: R1.1M MRR target — Series A readiness', 1129000, 360, '{SkyFibre SMB,ClinicConnect,ParkConnect DUNE,Managed IT,CloudWiFi WaaS,BizFibreConnect}', 49900, 'Hire Junior Support/Admin (R1.0M MRR sustained 2mo)', '2027-03-01', '2027-03-31')
ON CONFLICT (month_number) DO NOTHING;

-- =============================================================================
-- Seed: Product Wholesale Costs (from MTN Wholesale + provider references)
-- =============================================================================

INSERT INTO product_wholesale_costs (product_name, wholesale_provider, wholesale_mrc, wholesale_nrc, retail_price, notes, effective_date) VALUES
  ('SkyFibre SMB 50/50', 'MTN', 499.00, 0, 1299.00, 'MTN Tarana FWB 4:1 contention', '2026-04-01'),
  ('SkyFibre SMB 100/100', 'MTN', 599.00, 0, 1599.00, 'MTN Tarana FWB 4:1 contention', '2026-04-01'),
  ('SkyFibre SMB 200/200', 'MTN', 699.00, 0, 1899.00, 'MTN Tarana FWB 4:1 contention', '2026-04-01'),
  ('ClinicConnect', 'MTN', 499.00, 0, 1499.00, 'MTN Tarana FWB dedicated for Unjani clinics', '2026-04-01'),
  ('ParkConnect DUNE', 'MTN', 699.00, 0, 2549.00, 'MTN Tarana + MiRO DUNE 60GHz CPE', '2026-04-01'),
  ('BizFibreConnect 100M', 'DFA', 1200.00, 2500, 2999.00, 'DFA Dark Fibre metro ethernet', '2026-04-01'),
  ('BizFibreConnect 200M', 'DFA', 1800.00, 2500, 4499.00, 'DFA Dark Fibre metro ethernet', '2026-04-01'),
  ('WorkConnect SOHO', 'MTN', 399.00, 0, 799.00, 'MTN FWB/FTTH/5G/LTE mix', '2026-04-01'),
  ('CloudWiFi Professional', 'MTN', 499.00, 0, 1499.00, 'Managed overlay WiFi on SkyFibre underlay', '2026-04-01'),
  ('SmartBranch LTE Backup', 'Arlan', 149.00, 0, 499.00, 'Arlan MTN LTE backup connectivity', '2026-04-01')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_execution_milestones_phase ON execution_milestones(phase);
CREATE INDEX IF NOT EXISTS idx_execution_milestones_status ON execution_milestones(status);
CREATE INDEX IF NOT EXISTS idx_product_wholesale_costs_product ON product_wholesale_costs(product_name);
CREATE INDEX IF NOT EXISTS idx_product_wholesale_costs_provider ON product_wholesale_costs(wholesale_provider);
CREATE INDEX IF NOT EXISTS idx_sales_engine_config_key ON sales_engine_config(config_key);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_execution_milestones_updated_at ON execution_milestones;
CREATE TRIGGER set_execution_milestones_updated_at
  BEFORE UPDATE ON execution_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_product_wholesale_costs_updated_at ON product_wholesale_costs;
CREATE TRIGGER set_product_wholesale_costs_updated_at
  BEFORE UPDATE ON product_wholesale_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
