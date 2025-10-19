-- =============================================================================
-- SIMPLE MIGRATION: Just coverage_leads table
-- Run this FIRST to test if the basic structure works
-- =============================================================================

-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Enums
DO $$ BEGIN CREATE TYPE customer_type AS ENUM ('consumer', 'smme', 'enterprise'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lead_source AS ENUM ('coverage_checker', 'business_inquiry', 'website_form', 'referral', 'marketing_campaign', 'social_media', 'direct_sales', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 3: Create Table
CREATE TABLE coverage_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type customer_type NOT NULL DEFAULT 'consumer',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  coordinates JSONB,
  lead_source lead_source NOT NULL DEFAULT 'coverage_checker',
  source_campaign TEXT,
  referral_code TEXT,
  coverage_check_id UUID,
  requested_service_type TEXT,
  requested_speed TEXT,
  budget_range TEXT,
  zoho_lead_id TEXT UNIQUE,
  zoho_synced_at TIMESTAMPTZ,
  zoho_sync_status TEXT DEFAULT 'pending',
  zoho_sync_error TEXT,
  contact_preference TEXT DEFAULT 'email',
  best_contact_time TEXT,
  follow_up_notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'coverage_available', 'converted_to_order', 'lost', 'follow_up_scheduled')),
  converted_to_order_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Indexes
CREATE INDEX idx_coverage_leads_customer_type ON coverage_leads(customer_type);
CREATE INDEX idx_coverage_leads_status ON coverage_leads(status);
CREATE INDEX idx_coverage_leads_email ON coverage_leads(email);
CREATE INDEX idx_coverage_leads_phone ON coverage_leads(phone);
CREATE INDEX idx_coverage_leads_zoho_lead_id ON coverage_leads(zoho_lead_id);
CREATE INDEX idx_coverage_leads_created_at ON coverage_leads(created_at DESC);
CREATE INDEX idx_coverage_leads_next_follow_up ON coverage_leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- Step 5: Verify
SELECT 'Table created successfully' as status, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'coverage_leads';

SELECT 'Email column exists' as status
FROM information_schema.columns
WHERE table_name = 'coverage_leads' AND column_name = 'email';
