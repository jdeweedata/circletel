-- =============================================================================
-- Migration: add_arlan_fields_to_zone_discovery
-- =============================================================================
-- Description: Adds Arlan opportunity tracking to zone discovery candidates.
--              Every zone gets Arlan MRR potential since MTN LTE/5G is national.
-- Version: 1.0
-- Created: 2026-03-21
-- =============================================================================

ALTER TABLE public.zone_discovery_candidates
  ADD COLUMN IF NOT EXISTS estimated_arlan_mrr NUMERIC DEFAULT 0;

ALTER TABLE public.zone_discovery_candidates
  ADD COLUMN IF NOT EXISTS arlan_upsell_use_cases TEXT[] DEFAULT '{}';

-- =============================================================================
-- End of Migration
-- =============================================================================
