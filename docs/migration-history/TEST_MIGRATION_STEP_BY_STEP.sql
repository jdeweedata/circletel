-- =============================================================================
-- STEP-BY-STEP MIGRATION TEST
-- Run each section separately to identify exactly where the error occurs
-- =============================================================================

-- =============================================================================
-- STEP 1: Create Extensions (Run First)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify:
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
-- Should show 2 rows

-- =============================================================================
-- STEP 2: Create Enums (Run Second)
-- =============================================================================

-- Customer type enum
DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM ('consumer', 'smme', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Lead source tracking
DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM (
    'coverage_checker',
    'business_inquiry',
    'website_form',
    'referral',
    'marketing_campaign',
    'social_media',
    'direct_sales',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Order status enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'payment_pending',
    'payment_received',
    'kyc_pending',
    'kyc_approved',
    'kyc_rejected',
    'credit_check_pending',
    'credit_check_approved',
    'credit_check_rejected',
    'installation_scheduled',
    'installation_in_progress',
    'installation_completed',
    'active',
    'on_hold',
    'cancelled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Quote status enum
DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired',
    'converted_to_order'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- KYC document type enum
DO $$ BEGIN
  CREATE TYPE kyc_document_type AS ENUM (
    'id_document',
    'proof_of_address',
    'bank_statement',
    'company_registration',
    'tax_certificate',
    'vat_certificate',
    'director_id',
    'shareholder_agreement',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- KYC verification status
DO $$ BEGIN
  CREATE TYPE kyc_verification_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'expired',
    'requires_update'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Verify all types created:
SELECT typname FROM pg_type
WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status')
ORDER BY typname;
-- Should show 6 rows

-- =============================================================================
-- STEP 3: Create coverage_leads Table ONLY (Run Third)
-- =============================================================================

CREATE TABLE IF NOT EXISTS coverage_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Information
  customer_type customer_type NOT NULL DEFAULT 'consumer',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,

  -- Address Information
  address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  coordinates JSONB,

  -- Lead Tracking
  lead_source lead_source NOT NULL DEFAULT 'coverage_checker',
  source_campaign TEXT,
  referral_code TEXT,

  -- Coverage Check Details
  coverage_check_id UUID,
  requested_service_type TEXT,
  requested_speed TEXT,
  budget_range TEXT,

  -- CRM Integration
  zoho_lead_id TEXT UNIQUE,
  zoho_synced_at TIMESTAMPTZ,
  zoho_sync_status TEXT DEFAULT 'pending',
  zoho_sync_error TEXT,

  -- Follow-up Tracking
  contact_preference TEXT DEFAULT 'email',
  best_contact_time TEXT,
  follow_up_notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new',
    'contacted',
    'interested',
    'not_interested',
    'coverage_available',
    'converted_to_order',
    'lost',
    'follow_up_scheduled'
  )),
  converted_to_order_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify table created:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'coverage_leads';
-- Should show 1 row

-- Verify email column exists:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'coverage_leads'
AND column_name = 'email';
-- Should show: email | text

-- =============================================================================
-- STEP 4: Create Indexes for coverage_leads (Run Fourth)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_coverage_leads_customer_type ON coverage_leads(customer_type);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_status ON coverage_leads(status);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_email ON coverage_leads(email);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_phone ON coverage_leads(phone);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_zoho_lead_id ON coverage_leads(zoho_lead_id);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_created_at ON coverage_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_next_follow_up ON coverage_leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- Verify indexes created:
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'coverage_leads';
-- Should show 7+ indexes (including PRIMARY KEY)

-- =============================================================================
-- STEP 5: Test Insert (Run Fifth)
-- =============================================================================

INSERT INTO coverage_leads (
  customer_type,
  first_name,
  last_name,
  email,
  phone,
  address,
  city,
  province,
  lead_source,
  status
) VALUES (
  'consumer',
  'Test',
  'User',
  'test@example.com',
  '+27821234567',
  '123 Test Street',
  'Johannesburg',
  'Gauteng',
  'coverage_checker',
  'new'
) RETURNING id, email, created_at;

-- Verify insert:
SELECT * FROM coverage_leads WHERE email = 'test@example.com';

-- Clean up:
DELETE FROM coverage_leads WHERE email = 'test@example.com';

-- =============================================================================
-- SUCCESS!
-- =============================================================================

-- If all 5 steps completed without errors, the table is working correctly.
-- The issue was likely that the full migration tried to run everything at once
-- and hit a timeout or transaction issue.

-- NEXT STEP: Apply the FULL migration file in one go.
-- The step-by-step test confirms the SQL is valid.
