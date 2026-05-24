-- =============================================================================
-- Customer Journey System Migration
-- Phase 1: Foundation for B2C Consumer and B2B SMME Journeys
-- Created: 2025-10-19
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
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

-- =============================================================================
-- TABLE 1: coverage_leads
-- Purpose: Capture leads from coverage checker (no coverage available)
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
  coordinates JSONB, -- { lat: number, lng: number }

  -- Lead Tracking
  lead_source lead_source NOT NULL DEFAULT 'coverage_checker',
  source_campaign TEXT,
  referral_code TEXT,

  -- Coverage Check Details
  coverage_check_id UUID, -- References coverage_checks(id) if it exists
  requested_service_type TEXT, -- 'fibre', 'wireless', '5g', etc.
  requested_speed TEXT,
  budget_range TEXT,

  -- CRM Integration
  zoho_lead_id TEXT UNIQUE,
  zoho_synced_at TIMESTAMPTZ,
  zoho_sync_status TEXT DEFAULT 'pending',
  zoho_sync_error TEXT,

  -- Follow-up Tracking
  contact_preference TEXT DEFAULT 'email', -- 'email', 'phone', 'whatsapp', 'sms'
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

-- Indexes for coverage_leads
CREATE INDEX IF NOT EXISTS idx_coverage_leads_customer_type ON coverage_leads(customer_type);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_status ON coverage_leads(status);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_email ON coverage_leads(email);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_phone ON coverage_leads(phone);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_zoho_lead_id ON coverage_leads(zoho_lead_id);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_created_at ON coverage_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coverage_leads_next_follow_up ON coverage_leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- =============================================================================
-- TABLE 2: consumer_orders
-- Purpose: B2C consumer order tracking (simple flow)
-- =============================================================================

CREATE TABLE IF NOT EXISTS consumer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,

  -- Customer Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,

  -- Installation Address
  installation_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  coordinates JSONB,
  special_instructions TEXT,

  -- Billing Address (if different)
  billing_same_as_installation BOOLEAN DEFAULT true,
  billing_address TEXT,
  billing_suburb TEXT,
  billing_city TEXT,
  billing_province TEXT,
  billing_postal_code TEXT,

  -- Product Selection
  service_package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  package_speed TEXT NOT NULL,
  package_price DECIMAL(10,2) NOT NULL,
  installation_fee DECIMAL(10,2) NOT NULL,
  router_included BOOLEAN DEFAULT false,
  router_rental_fee DECIMAL(10,2),

  -- Coverage Details
  coverage_check_id UUID, -- References coverage_checks(id) if it exists
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE SET NULL,

  -- Payment Information
  payment_method TEXT, -- 'eft', 'card', 'debit_order', 'cash'
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'paid',
    'partial',
    'failed',
    'refunded'
  )),
  payment_reference TEXT,
  payment_date TIMESTAMPTZ,
  total_paid DECIMAL(10,2) DEFAULT 0,

  -- Order Status
  status order_status NOT NULL DEFAULT 'pending',

  -- Installation Details
  preferred_installation_date DATE,
  installation_scheduled_date DATE,
  installation_time_slot TEXT,
  installation_completed_date DATE,
  technician_notes TEXT,

  -- Activation Details
  activation_date DATE,
  account_number TEXT,
  connection_id TEXT,

  -- Communication Preferences
  contact_preference TEXT DEFAULT 'email',
  marketing_opt_in BOOLEAN DEFAULT false,
  whatsapp_opt_in BOOLEAN DEFAULT false,

  -- Order Source
  lead_source lead_source NOT NULL DEFAULT 'coverage_checker',
  source_campaign TEXT,
  referral_code TEXT,
  referred_by TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for consumer_orders
CREATE INDEX IF NOT EXISTS idx_consumer_orders_order_number ON consumer_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_status ON consumer_orders(status);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_email ON consumer_orders(email);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_phone ON consumer_orders(phone);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_created_at ON consumer_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_installation_date ON consumer_orders(installation_scheduled_date) WHERE installation_scheduled_date IS NOT NULL;

-- =============================================================================
-- TABLE 3: business_quotes
-- Purpose: B2B SMME quote generation and tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,

  -- Company Information
  company_name TEXT NOT NULL,
  company_registration_number TEXT,
  vat_number TEXT,
  industry TEXT,
  company_size TEXT, -- 'micro', 'small', 'medium'

  -- Contact Person
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_title TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_alternate_phone TEXT,

  -- Business Address
  business_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  coordinates JSONB,

  -- Service Requirements
  service_package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  package_speed TEXT NOT NULL,
  number_of_connections INTEGER DEFAULT 1,
  additional_services TEXT[], -- ['static_ip', 'managed_router', 'vpn', etc.]

  -- Pricing
  monthly_recurring DECIMAL(10,2) NOT NULL,
  installation_fee DECIMAL(10,2) NOT NULL,
  router_cost DECIMAL(10,2),
  additional_costs JSONB DEFAULT '[]'::jsonb, -- [{ item, amount }]
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Quote Details
  status quote_status NOT NULL DEFAULT 'draft',
  valid_until DATE NOT NULL,
  terms_and_conditions TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  contract_duration INTEGER DEFAULT 24, -- months

  -- Coverage Details
  coverage_check_id UUID, -- References coverage_checks(id) if it exists
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE SET NULL,

  -- Sales Tracking
  sales_rep_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  sales_rep_name TEXT,
  lead_source lead_source NOT NULL DEFAULT 'business_inquiry',
  source_campaign TEXT,

  -- Quote Interaction
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Conversion
  converted_to_order BOOLEAN DEFAULT false,
  converted_to_order_id UUID,
  conversion_date TIMESTAMPTZ,

  -- CRM Integration
  zoho_quote_id TEXT UNIQUE,
  zoho_synced_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for business_quotes
CREATE INDEX IF NOT EXISTS idx_business_quotes_quote_number ON business_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_business_quotes_status ON business_quotes(status);
CREATE INDEX IF NOT EXISTS idx_business_quotes_company_name ON business_quotes(company_name);
CREATE INDEX IF NOT EXISTS idx_business_quotes_contact_email ON business_quotes(contact_email);
CREATE INDEX IF NOT EXISTS idx_business_quotes_sales_rep ON business_quotes(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_business_quotes_created_at ON business_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_quotes_valid_until ON business_quotes(valid_until);

-- =============================================================================
-- TABLE 4: kyc_documents
-- Purpose: KYC/FICA document storage and verification tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document Owner
  customer_type customer_type NOT NULL,
  consumer_order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE,
  business_quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,

  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company_name TEXT,

  -- Document Details
  document_type kyc_document_type NOT NULL,
  document_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- bytes
  file_type TEXT NOT NULL, -- mime type
  document_number TEXT, -- ID number, registration number, etc.
  issue_date DATE,
  expiry_date DATE,

  -- Verification
  verification_status kyc_verification_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  rejection_reason TEXT,

  -- Security
  is_sensitive BOOLEAN DEFAULT true,
  encrypted BOOLEAN DEFAULT false,
  access_log JSONB DEFAULT '[]'::jsonb, -- [{ user_id, accessed_at, action }]

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT kyc_order_reference_check CHECK (
    (consumer_order_id IS NOT NULL AND business_quote_id IS NULL) OR
    (consumer_order_id IS NULL AND business_quote_id IS NOT NULL)
  )
);

-- Indexes for kyc_documents
CREATE INDEX IF NOT EXISTS idx_kyc_documents_consumer_order ON kyc_documents(consumer_order_id) WHERE consumer_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kyc_documents_business_quote ON kyc_documents(business_quote_id) WHERE business_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verification_status ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_document_type ON kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_customer_email ON kyc_documents(customer_email);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_expiry_date ON kyc_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- =============================================================================
-- TABLE 5: order_status_history
-- Purpose: Track all status changes for orders and quotes
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to Order/Quote
  entity_type TEXT NOT NULL CHECK (entity_type IN ('consumer_order', 'business_quote', 'coverage_lead')),
  entity_id UUID NOT NULL,

  -- Status Change
  old_status TEXT,
  new_status TEXT NOT NULL,
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Change Details
  changed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  change_reason TEXT,
  automated BOOLEAN DEFAULT false, -- true if status changed by system

  -- Notification
  customer_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_method TEXT, -- 'email', 'sms', 'whatsapp', 'push'

  -- Additional Context
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_entity ON order_status_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_status_changed_at ON order_status_history(status_changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON order_status_history(changed_by);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20251019-0001)
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Check if number already exists
    SELECT COUNT(*) INTO exists_check
    FROM consumer_orders
    WHERE order_number = order_num;

    EXIT WHEN exists_check = 0;
  END LOOP;

  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  quote_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Format: QTE-YYYYMMDD-XXXX (e.g., QTE-20251019-0001)
    quote_num := 'QTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Check if number already exists
    SELECT COUNT(*) INTO exists_check
    FROM business_quotes
    WHERE quote_number = quote_num;

    EXIT WHEN exists_check = 0;
  END LOOP;

  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  additional_total DECIMAL(10,2) := 0;
  vat_rate DECIMAL(5,4) := 0.15; -- 15% VAT
BEGIN
  -- Calculate additional costs total
  IF NEW.additional_costs IS NOT NULL THEN
    SELECT COALESCE(SUM((item->>'amount')::DECIMAL), 0)
    INTO additional_total
    FROM jsonb_array_elements(NEW.additional_costs) AS item;
  END IF;

  -- Calculate subtotal
  NEW.subtotal := (NEW.monthly_recurring + NEW.installation_fee + COALESCE(NEW.router_cost, 0) + additional_total) - COALESCE(NEW.discount_amount, 0);

  -- Calculate VAT
  NEW.vat_amount := NEW.subtotal * vat_rate;

  -- Calculate total
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_coverage_leads_updated_at
  BEFORE UPDATE ON coverage_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumer_orders_updated_at
  BEFORE UPDATE ON consumer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_quotes_updated_at
  BEFORE UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-calculate quote totals
CREATE TRIGGER calculate_business_quote_totals
  BEFORE INSERT OR UPDATE OF monthly_recurring, installation_fee, router_cost, additional_costs, discount_amount
  ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_totals();

-- Trigger to track status changes in order_status_history
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_status_history (
      entity_type,
      entity_id,
      old_status,
      new_status,
      automated
    ) VALUES (
      TG_TABLE_NAME::TEXT,
      NEW.id,
      OLD.status,
      NEW.status,
      true -- Assume automated unless changed via API
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_consumer_order_status
  AFTER INSERT OR UPDATE OF status ON consumer_orders
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

CREATE TRIGGER track_business_quote_status
  AFTER INSERT OR UPDATE OF status ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

CREATE TRIGGER track_coverage_lead_status
  AFTER INSERT OR UPDATE OF status ON coverage_leads
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE coverage_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coverage_leads
CREATE POLICY "Admin users can view all coverage leads"
  ON coverage_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can manage coverage leads"
  ON coverage_leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for consumer_orders
CREATE POLICY "Admin users can view all consumer orders"
  ON consumer_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can manage consumer orders"
  ON consumer_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for business_quotes
CREATE POLICY "Admin users can view all business quotes"
  ON business_quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can manage business quotes"
  ON business_quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for kyc_documents
CREATE POLICY "Admin users can view KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can manage KYC documents"
  ON kyc_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for order_status_history
CREATE POLICY "Admin users can view order history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE coverage_leads IS 'Stores leads captured from coverage checker when no coverage is available';
COMMENT ON TABLE consumer_orders IS 'B2C consumer orders with simple checkout flow';
COMMENT ON TABLE business_quotes IS 'B2B SMME quote generation and tracking';
COMMENT ON TABLE kyc_documents IS 'KYC/FICA document storage and verification tracking';
COMMENT ON TABLE order_status_history IS 'Audit trail for all status changes on orders and quotes';

-- =============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- =============================================================================

-- Add sample coverage lead
-- INSERT INTO coverage_leads (
--   customer_type,
--   first_name,
--   last_name,
--   email,
--   phone,
--   address,
--   suburb,
--   city,
--   province,
--   lead_source,
--   status
-- ) VALUES (
--   'consumer',
--   'John',
--   'Doe',
--   'john.doe@example.com',
--   '+27821234567',
--   '123 Main Road',
--   'Sandton',
--   'Johannesburg',
--   'Gauteng',
--   'coverage_checker',
--   'new'
-- );

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
