-- =============================================================================
-- Migration: add_curation_to_mtn_dealer_products
-- =============================================================================
-- Description: Adds curation status, business use case taxonomy, and auto-curation
--              support to mtn_dealer_products for managing 10K+ MTN Arlan deals
--              down to a curated CircleTel product catalogue.
-- Version: 1.0
-- Created: 2026-03-21
-- =============================================================================

-- =============================================================================
-- 1. Add Curation Columns
-- =============================================================================

-- Curation status: controls visibility and recommendation level
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS curation_status TEXT NOT NULL DEFAULT 'uncurated'
    CHECK (curation_status IN ('uncurated', 'recommended', 'featured', 'hidden'));

-- Business use case taxonomy for categorizing deals by customer need
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS business_use_case TEXT
    CHECK (business_use_case IN (
      'mobile_workforce',
      'fleet_management',
      'voice_comms',
      'data_connectivity',
      'iot_m2m',
      'device_upgrade',
      'backup_connectivity',
      'venue_wifi'
    ));

-- Whether this deal was auto-curated by rules (vs manually curated)
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS auto_curated BOOLEAN NOT NULL DEFAULT false;

-- Frontend visibility (only curated + explicitly enabled deals show on public pages)
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS is_visible_on_frontend BOOLEAN NOT NULL DEFAULT false;

-- Total data (combined bundle + inclusive) from March 2026 spreadsheet
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS total_data TEXT;

-- Total minutes (combined bundle + inclusive) from March 2026 spreadsheet
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS total_minutes TEXT;

-- Freebie device inventory status (separate from main device)
ALTER TABLE public.mtn_dealer_products
  ADD COLUMN IF NOT EXISTS freebie_inventory_status TEXT;

-- =============================================================================
-- 2. Create Indexes for Curation Queries
-- =============================================================================

-- Fast lookup of curated deals (the most common query pattern)
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_curation_status
  ON public.mtn_dealer_products(curation_status)
  WHERE curation_status IN ('recommended', 'featured');

-- Filter by business use case
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_business_use_case
  ON public.mtn_dealer_products(business_use_case)
  WHERE business_use_case IS NOT NULL;

-- Frontend-visible deals
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_frontend_visible
  ON public.mtn_dealer_products(is_visible_on_frontend)
  WHERE is_visible_on_frontend = true;

-- Composite index for auto-curation filter queries
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_curation_filter
  ON public.mtn_dealer_products(device_status, contract_term, mtn_price_incl_vat, status)
  WHERE status = 'active';

-- =============================================================================
-- 3. Create Curated Deals View
-- =============================================================================

CREATE OR REPLACE VIEW public.v_mtn_curated_deals AS
SELECT
  p.id,
  p.deal_id,
  p.price_plan,
  p.package_description,
  p.tariff_description,
  p.technology,
  p.contract_term,
  p.contract_term_label,
  p.has_device,
  p.device_name,
  p.device_status,
  p.once_off_pay_in_incl_vat,

  -- Pricing
  p.mtn_price_incl_vat,
  p.mtn_price_excl_vat,
  p.markup_type,
  p.markup_value,
  p.selling_price_excl_vat,
  p.selling_price_incl_vat,

  -- Commission
  p.commission_tier,
  p.mtn_commission_rate,
  p.circletel_commission_share,
  (p.mtn_price_incl_vat * p.contract_term * p.mtn_commission_rate / 100) AS mtn_commission_to_arlan,
  (p.mtn_price_incl_vat * p.contract_term * p.mtn_commission_rate / 100 * p.circletel_commission_share / 100) AS circletel_commission,
  (p.mtn_commission_rate * p.circletel_commission_share / 100) AS effective_commission_rate,

  -- Markup revenue (monthly, 100% to CircleTel)
  CASE p.markup_type
    WHEN 'percentage' THEN p.mtn_price_excl_vat * (p.markup_value / 100)
    WHEN 'fixed' THEN p.markup_value
    ELSE 0
  END AS monthly_markup_revenue,

  -- Bundles
  p.data_bundle,
  p.data_bundle_gb,
  p.anytime_minutes,
  p.anytime_minutes_value,
  p.on_net_minutes,
  p.sms_bundle,
  p.total_data,
  p.total_minutes,

  -- Freebies
  p.freebies_device,
  p.freebies_priceplan,
  p.free_sim,
  p.free_cli,
  p.free_itb,

  -- Curation
  p.curation_status,
  p.business_use_case,
  p.auto_curated,
  p.is_visible_on_frontend,

  -- Deal period
  p.promo_start_date,
  p.promo_end_date,
  (p.promo_start_date <= CURRENT_DATE AND (p.promo_end_date IS NULL OR p.promo_end_date >= CURRENT_DATE)) AS is_current_deal,

  -- Channel
  p.channel,
  p.available_on_helios,
  p.available_on_ilula,

  -- Status
  p.status,
  p.inventory_status

FROM public.mtn_dealer_products p
WHERE p.status = 'active'
  AND p.curation_status IN ('recommended', 'featured');

-- =============================================================================
-- End of Migration
-- =============================================================================
