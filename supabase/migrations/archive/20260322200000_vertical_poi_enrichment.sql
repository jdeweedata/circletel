-- Vertical POI Enrichment: Add granular vertical market classification columns
-- Phase 1 of Sniper Engine Data Enrichment

-- Add vertical POI count columns to ward_demographics
ALTER TABLE ward_demographics ADD COLUMN IF NOT EXISTS fleet_logistics_poi_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ward_demographics ADD COLUMN IF NOT EXISTS security_poi_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ward_demographics ADD COLUMN IF NOT EXISTS hospitality_poi_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ward_demographics ADD COLUMN IF NOT EXISTS retail_chain_poi_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ward_demographics ADD COLUMN IF NOT EXISTS industrial_poi_count INTEGER NOT NULL DEFAULT 0;

-- Add vertical composition JSONB to sales_zones
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS vertical_composition JSONB DEFAULT '{}'::jsonb;
