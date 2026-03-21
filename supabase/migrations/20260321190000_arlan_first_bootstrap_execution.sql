-- =============================================================================
-- Migration: arlan_first_bootstrap_execution
-- =============================================================================
-- Description: Updates execution plan for Arlan-first bootstrap strategy.
--              Adds channel-split MRR tracking to milestones and revenue_source
--              to pipeline stages. R250K capital, cold start, R1.2M MRR target.
-- Version: 1.0
-- Created: 2026-03-21
-- =============================================================================

-- =============================================================================
-- 1. Add channel-split columns to execution_milestones
-- =============================================================================

ALTER TABLE public.execution_milestones
  ADD COLUMN IF NOT EXISTS target_arlan_deals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_arlan_mrr NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_tarana_customers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_tarana_mrr NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_arlan_deals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_arlan_mrr NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_tarana_customers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_tarana_mrr NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capital_budget_used NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capital_budget_remaining NUMERIC DEFAULT 250000;

-- =============================================================================
-- 2. Update milestones with Arlan-first targets
-- =============================================================================

-- Phase 1: Arlan Cash Machine (Months 1-3)
UPDATE public.execution_milestones SET
  target_mrr = 6800,
  target_customers = 50,
  target_arlan_deals = 50,
  target_arlan_mrr = 6800,
  target_tarana_customers = 0,
  target_tarana_mrr = 0,
  target_products = ARRAY['Arlan MTN Device Upgrades', 'Arlan MTN Voice'],
  msc_commitment = 0,
  notes = 'Phase 1: Arlan-only. Target 50 deals via LinkedIn + WhatsApp outreach. Zero CAPEX.',
  period_start = '2026-04-01',
  period_end = '2026-04-30'
WHERE month_number = 1;

UPDATE public.execution_milestones SET
  target_mrr = 20400,
  target_customers = 150,
  target_arlan_deals = 150,
  target_arlan_mrr = 20400,
  target_tarana_customers = 0,
  target_tarana_mrr = 0,
  target_products = ARRAY['Arlan MTN Device Upgrades', 'Arlan MTN Voice', 'Arlan MTN Data'],
  msc_commitment = 0,
  notes = 'Phase 1: Arlan ramp. 100 new deals. Sales ops established.',
  period_start = '2026-05-01',
  period_end = '2026-05-31'
WHERE month_number = 2;

UPDATE public.execution_milestones SET
  target_mrr = 49500,
  target_customers = 305,
  target_arlan_deals = 300,
  target_arlan_mrr = 40800,
  target_tarana_customers = 5,
  target_tarana_mrr = 8700,
  target_products = ARRAY['Arlan MTN Device Upgrades', 'Arlan MTN Voice', 'SkyFibre SMB'],
  msc_commitment = 0,
  notes = 'Phase 1 exit: Deploy NNI, first 5 SkyFibre customers. Arlan cash funds infrastructure.',
  period_start = '2026-06-01',
  period_end = '2026-06-30'
WHERE month_number = 3;

-- Phase 2: Dual-Channel Ramp (Months 4-6) — MSC starts
UPDATE public.execution_milestones SET
  target_mrr = 94100,
  target_customers = 515,
  target_arlan_deals = 500,
  target_arlan_mrr = 68000,
  target_tarana_customers = 15,
  target_tarana_mrr = 26100,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB'],
  msc_commitment = 14970,
  notes = 'Phase 2: MSC kicks in at R14,970/mo. 15 Tarana wholesale spend = R7,485 (below MSC — gap covered by Arlan cash).',
  period_start = '2026-07-01',
  period_end = '2026-07-31'
WHERE month_number = 4;

UPDATE public.execution_milestones SET
  target_mrr = 147400,
  target_customers = 730,
  target_arlan_deals = 700,
  target_arlan_mrr = 95200,
  target_tarana_customers = 30,
  target_tarana_mrr = 52200,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB'],
  msc_commitment = 14970,
  notes = 'Phase 2: Tarana wholesale spend approaching MSC. Arlan cash funds installations.',
  period_start = '2026-08-01',
  period_end = '2026-08-31'
WHERE month_number = 5;

UPDATE public.execution_milestones SET
  target_mrr = 209400,
  target_customers = 950,
  target_arlan_deals = 900,
  target_arlan_mrr = 122400,
  target_tarana_customers = 50,
  target_tarana_mrr = 87000,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB'],
  msc_commitment = 14970,
  hiring_trigger = 'Sales Rep 1 at R200K+ MRR',
  notes = 'Phase 2 exit: 50 Tarana customers × R499 = R24,950 exceeds MSC. Self-funding achieved.',
  period_start = '2026-09-01',
  period_end = '2026-09-30'
WHERE month_number = 6;

-- Phase 3: Scale (Months 7-9) — MSC escalates to R29,940
UPDATE public.execution_milestones SET
  target_mrr = 288800,
  target_customers = 1180,
  target_arlan_deals = 1100,
  target_arlan_mrr = 149600,
  target_tarana_customers = 80,
  target_tarana_mrr = 139200,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB', 'ParkConnect DUNE'],
  msc_commitment = 29940,
  hiring_trigger = 'Sales Rep 1',
  notes = 'Phase 3: MSC escalates 2x. 80 Tarana × R499 = R39,920 covers MSC. Hire first sales rep.',
  period_start = '2026-10-01',
  period_end = '2026-10-31'
WHERE month_number = 7;

UPDATE public.execution_milestones SET
  target_mrr = 392400,
  target_customers = 1470,
  target_arlan_deals = 1350,
  target_arlan_mrr = 183600,
  target_tarana_customers = 120,
  target_tarana_mrr = 208800,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB', 'ParkConnect DUNE', 'CloudWiFi WaaS'],
  msc_commitment = 29940,
  hiring_trigger = 'Technical Installer',
  notes = 'Phase 3: Hire installer. 120 Tarana × R499 = R59,880 = 2x MSC coverage.',
  period_start = '2026-11-01',
  period_end = '2026-11-30'
WHERE month_number = 8;

UPDATE public.execution_milestones SET
  target_mrr = 513400,
  target_customers = 1770,
  target_arlan_deals = 1600,
  target_arlan_mrr = 217600,
  target_tarana_customers = 170,
  target_tarana_mrr = 295800,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB', 'ParkConnect DUNE', 'CloudWiFi WaaS'],
  msc_commitment = 29940,
  notes = 'Phase 3 exit: R500K+ MRR crossed. MSC coverage 2.8x. Fully self-funding.',
  period_start = '2026-12-01',
  period_end = '2026-12-31'
WHERE month_number = 9;

-- Phase 4: Expand (Months 10-12) — Push to R1.2M
UPDATE public.execution_milestones SET
  target_mrr = 658600,
  target_customers = 2130,
  target_arlan_deals = 1900,
  target_arlan_mrr = 258400,
  target_tarana_customers = 230,
  target_tarana_mrr = 400200,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB', 'ParkConnect DUNE', 'CloudWiFi WaaS', 'BizFibreConnect'],
  msc_commitment = 49900,
  hiring_trigger = 'Sales Rep 2',
  notes = 'Phase 4: MSC escalates to R49,900. 230 Tarana × R499 = R114,770 = 2.3x MSC. Hire second sales rep.',
  period_start = '2027-01-01',
  period_end = '2027-01-31'
WHERE month_number = 10;

UPDATE public.execution_milestones SET
  target_mrr = 828000,
  target_customers = 2550,
  target_arlan_deals = 2250,
  target_arlan_mrr = 306000,
  target_tarana_customers = 300,
  target_tarana_mrr = 522000,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB', 'ParkConnect DUNE', 'CloudWiFi WaaS', 'BizFibreConnect', 'Managed IT'],
  msc_commitment = 49900,
  notes = 'Phase 4: R800K+ MRR. DFA BizFibreConnect adds enterprise clients.',
  period_start = '2027-02-01',
  period_end = '2027-02-28'
WHERE month_number = 11;

UPDATE public.execution_milestones SET
  target_mrr = 1200000,
  target_customers = 3000,
  target_arlan_deals = 2600,
  target_arlan_mrr = 353600,
  target_tarana_customers = 400,
  target_tarana_mrr = 696000,
  target_products = ARRAY['Arlan MTN All', 'SkyFibre SMB', 'ParkConnect DUNE', 'CloudWiFi WaaS', 'BizFibreConnect', 'Managed IT'],
  msc_commitment = 49900,
  hiring_trigger = 'Junior Support/Admin + Series A readiness',
  notes = 'Phase 4 exit: R1.2M MRR target. 2,600 Arlan + 400 Tarana. Gap closed with DFA + Managed IT upsells.',
  period_start = '2027-03-01',
  period_end = '2027-03-31'
WHERE month_number = 12;

-- =============================================================================
-- 3. Add revenue_source to sales_pipeline_stages
-- =============================================================================

ALTER TABLE public.sales_pipeline_stages
  ADD COLUMN IF NOT EXISTS revenue_source TEXT DEFAULT 'tarana'
    CHECK (revenue_source IN ('tarana', 'arlan', 'dfa', 'managed_it', 'bundle'));

-- Index for channel-split queries
CREATE INDEX IF NOT EXISTS idx_pipeline_revenue_source
  ON public.sales_pipeline_stages(revenue_source);

-- =============================================================================
-- 4. Capital tracking table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.capital_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN (
    'infrastructure', 'installation', 'marketing', 'operations',
    'hiring', 'bss_platform', 'contingency', 'revenue'
  )),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,  -- negative = spend, positive = revenue/inflow
  running_balance NUMERIC,
  related_milestone INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial capital
INSERT INTO public.capital_transactions (transaction_date, category, description, amount, running_balance)
VALUES ('2026-04-01', 'revenue', 'Initial startup capital', 250000, 250000);

-- RLS + service role
ALTER TABLE public.capital_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role bypass capital_transactions"
  ON public.capital_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin access capital_transactions"
  ON public.capital_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- =============================================================================
-- End of Migration
-- =============================================================================
