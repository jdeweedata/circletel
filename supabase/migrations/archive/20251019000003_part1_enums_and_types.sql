-- =============================================================================
-- Customer Journey System Migration - PART 1
-- Enums and Types Only
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
