-- =============================================================================
-- COMPLETE FIX MIGRATION V2
-- Fixed to handle existing coverage_leads table properly
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE ALL ENUMS (0 exist, need 6)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM ('consumer', 'smme', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

SELECT 'Enums created' as status, COUNT(*) as count
FROM pg_type
WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status');

-- =============================================================================
-- PART 2: FIX coverage_leads TABLE
-- The existing table has TEXT columns - we need to convert them carefully
-- =============================================================================

-- Step 1: Drop the default constraint first
ALTER TABLE coverage_leads ALTER COLUMN customer_type DROP DEFAULT;
ALTER TABLE coverage_leads ALTER COLUMN lead_source DROP DEFAULT;

-- Step 2: Convert column type using USING clause
ALTER TABLE coverage_leads
  ALTER COLUMN customer_type TYPE customer_type
  USING customer_type::customer_type;

ALTER TABLE coverage_leads
  ALTER COLUMN lead_source TYPE lead_source
  USING lead_source::lead_source;

-- Step 3: Re-add the defaults (now with enum type)
ALTER TABLE coverage_leads ALTER COLUMN customer_type SET DEFAULT 'consumer'::customer_type;
ALTER TABLE coverage_leads ALTER COLUMN lead_source SET DEFAULT 'coverage_checker'::lead_source;

SELECT 'coverage_leads columns fixed to use enums' as status;

-- =============================================================================
-- PART 3: CREATE REMAINING 4 TABLES
-- =============================================================================

-- TABLE 2: consumer_orders
CREATE TABLE IF NOT EXISTS consumer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  installation_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  coordinates JSONB,
  special_instructions TEXT,
  billing_same_as_installation BOOLEAN DEFAULT true,
  billing_address TEXT,
  billing_suburb TEXT,
  billing_city TEXT,
  billing_province TEXT,
  billing_postal_code TEXT,
  service_package_id UUID,
  package_name TEXT NOT NULL,
  package_speed TEXT NOT NULL,
  package_price DECIMAL(10,2) NOT NULL,
  installation_fee DECIMAL(10,2) NOT NULL,
  router_included BOOLEAN DEFAULT false,
  router_rental_fee DECIMAL(10,2),
  coverage_check_id UUID,
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE SET NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'failed', 'refunded')),
  payment_reference TEXT,
  payment_date TIMESTAMPTZ,
  total_paid DECIMAL(10,2) DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  preferred_installation_date DATE,
  installation_scheduled_date DATE,
  installation_time_slot TEXT,
  installation_completed_date DATE,
  technician_notes TEXT,
  activation_date DATE,
  account_number TEXT,
  connection_id TEXT,
  contact_preference TEXT DEFAULT 'email',
  marketing_opt_in BOOLEAN DEFAULT false,
  whatsapp_opt_in BOOLEAN DEFAULT false,
  lead_source lead_source NOT NULL DEFAULT 'coverage_checker',
  source_campaign TEXT,
  referral_code TEXT,
  referred_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumer_orders_order_number ON consumer_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_status ON consumer_orders(status);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_email ON consumer_orders(email);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_phone ON consumer_orders(phone);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_created_at ON consumer_orders(created_at DESC);

SELECT 'consumer_orders created' as status;

-- TABLE 3: business_quotes
CREATE TABLE IF NOT EXISTS business_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  company_registration_number TEXT,
  vat_number TEXT,
  industry TEXT,
  company_size TEXT,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_title TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_alternate_phone TEXT,
  business_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  coordinates JSONB,
  service_package_id UUID,
  package_name TEXT NOT NULL,
  package_speed TEXT NOT NULL,
  number_of_connections INTEGER DEFAULT 1,
  additional_services TEXT[],
  monthly_recurring DECIMAL(10,2) NOT NULL,
  installation_fee DECIMAL(10,2) NOT NULL,
  router_cost DECIMAL(10,2),
  additional_costs JSONB DEFAULT '[]'::jsonb,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status quote_status NOT NULL DEFAULT 'draft',
  valid_until DATE NOT NULL,
  terms_and_conditions TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  contract_duration INTEGER DEFAULT 24,
  coverage_check_id UUID,
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE SET NULL,
  sales_rep_id UUID,
  sales_rep_name TEXT,
  lead_source lead_source NOT NULL DEFAULT 'business_inquiry',
  source_campaign TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_to_order BOOLEAN DEFAULT false,
  converted_to_order_id UUID,
  conversion_date TIMESTAMPTZ,
  zoho_quote_id TEXT UNIQUE,
  zoho_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_quotes_quote_number ON business_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_business_quotes_status ON business_quotes(status);
CREATE INDEX IF NOT EXISTS idx_business_quotes_company_name ON business_quotes(company_name);
CREATE INDEX IF NOT EXISTS idx_business_quotes_contact_email ON business_quotes(contact_email);
CREATE INDEX IF NOT EXISTS idx_business_quotes_created_at ON business_quotes(created_at DESC);

SELECT 'business_quotes created' as status;

-- TABLE 4: kyc_documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type customer_type NOT NULL,
  consumer_order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE,
  business_quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company_name TEXT,
  document_type kyc_document_type NOT NULL,
  document_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  verification_status kyc_verification_status NOT NULL DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  rejection_reason TEXT,
  is_sensitive BOOLEAN DEFAULT true,
  encrypted BOOLEAN DEFAULT false,
  access_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT kyc_order_reference_check CHECK (
    (consumer_order_id IS NOT NULL AND business_quote_id IS NULL) OR
    (consumer_order_id IS NULL AND business_quote_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_consumer_order ON kyc_documents(consumer_order_id) WHERE consumer_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kyc_documents_business_quote ON kyc_documents(business_quote_id) WHERE business_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verification_status ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_document_type ON kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_customer_email ON kyc_documents(customer_email);

SELECT 'kyc_documents created' as status;

-- TABLE 5: order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('consumer_order', 'business_quote', 'coverage_lead')),
  entity_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID,
  change_reason TEXT,
  automated BOOLEAN DEFAULT false,
  customer_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_entity ON order_status_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_status_changed_at ON order_status_history(status_changed_at DESC);

SELECT 'order_status_history created' as status;

-- =============================================================================
-- PART 4: CREATE FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT COUNT(*) INTO exists_check FROM consumer_orders WHERE order_number = order_num;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  quote_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    quote_num := 'QTE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT COUNT(*) INTO exists_check FROM business_quotes WHERE quote_number = quote_num;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  additional_total DECIMAL(10,2) := 0;
  vat_rate DECIMAL(5,4) := 0.15;
BEGIN
  IF NEW.additional_costs IS NOT NULL THEN
    SELECT COALESCE(SUM((item->>'amount')::DECIMAL), 0)
    INTO additional_total
    FROM jsonb_array_elements(NEW.additional_costs) AS item;
  END IF;

  NEW.subtotal := (NEW.monthly_recurring + NEW.installation_fee + COALESCE(NEW.router_cost, 0) + additional_total) - COALESCE(NEW.discount_amount, 0);
  NEW.vat_amount := NEW.subtotal * vat_rate;
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
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
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'All functions created' as status;

-- =============================================================================
-- PART 5: CREATE TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_coverage_leads_updated_at ON coverage_leads;
CREATE TRIGGER update_coverage_leads_updated_at
  BEFORE UPDATE ON coverage_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consumer_orders_updated_at ON consumer_orders;
CREATE TRIGGER update_consumer_orders_updated_at
  BEFORE UPDATE ON consumer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_quotes_updated_at ON business_quotes;
CREATE TRIGGER update_business_quotes_updated_at
  BEFORE UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS calculate_business_quote_totals ON business_quotes;
CREATE TRIGGER calculate_business_quote_totals
  BEFORE INSERT OR UPDATE OF monthly_recurring, installation_fee, router_cost, additional_costs, discount_amount
  ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_totals();

DROP TRIGGER IF EXISTS track_consumer_order_status ON consumer_orders;
CREATE TRIGGER track_consumer_order_status
  AFTER INSERT OR UPDATE OF status ON consumer_orders
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

DROP TRIGGER IF EXISTS track_business_quote_status ON business_quotes;
CREATE TRIGGER track_business_quote_status
  AFTER INSERT OR UPDATE OF status ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

DROP TRIGGER IF EXISTS track_coverage_lead_status ON coverage_leads;
CREATE TRIGGER track_coverage_lead_status
  AFTER INSERT OR UPDATE OF status ON coverage_leads
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

SELECT 'All triggers created' as status;

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

SELECT 'MIGRATION COMPLETE' as status,
       'Tables: ' || (SELECT COUNT(*)::TEXT FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('coverage_leads', 'consumer_orders', 'business_quotes', 'kyc_documents', 'order_status_history')) || ' | ' ||
       'Enums: ' || (SELECT COUNT(*)::TEXT FROM pg_type WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status')) || ' | ' ||
       'Functions: ' || (SELECT COUNT(*)::TEXT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('generate_order_number', 'generate_quote_number', 'calculate_quote_totals', 'update_updated_at_column', 'track_status_change')) as summary;

-- Test functions
SELECT 'Test order number: ' || generate_order_number() as test1;
SELECT 'Test quote number: ' || generate_quote_number() as test2;

-- Expected final result: Tables: 5 | Enums: 6 | Functions: 5
