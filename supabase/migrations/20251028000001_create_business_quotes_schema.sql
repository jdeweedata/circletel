-- Business Quotes System Schema
-- Purpose: Comprehensive quote management for business customers
-- Features: Multi-service quotes, admin approval, digital signatures, versioning
-- Created: 2025-10-28

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Drop existing types if they exist (safe recreation)
DROP TYPE IF EXISTS quote_status CASCADE;
DROP TYPE IF EXISTS quote_item_type CASCADE;

-- Quote status lifecycle
CREATE TYPE quote_status AS ENUM (
  'draft',              -- Initial creation
  'pending_approval',   -- Submitted for admin review
  'approved',           -- Admin approved, ready to send
  'sent',               -- Sent to customer
  'viewed',             -- Customer viewed quote
  'accepted',           -- Customer accepted & signed
  'rejected',           -- Admin or customer rejected
  'expired'             -- Passed valid_until date
);

-- Service item types for multi-service quotes
CREATE TYPE quote_item_type AS ENUM (
  'primary',            -- Main service line
  'secondary',          -- Backup/redundancy line
  'additional'          -- Additional services
);

-- =====================================================
-- 2. MAIN TABLES
-- =====================================================

-- Business Quotes table
CREATE TABLE business_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,  -- Format: BQ-YYYY-NNN

  -- Customer information
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES coverage_leads(id) ON DELETE SET NULL,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('smme', 'enterprise')),

  -- Company details
  company_name TEXT NOT NULL,
  registration_number TEXT,
  vat_number TEXT,

  -- Contact details
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- Service location
  service_address TEXT NOT NULL,
  coordinates JSONB,  -- {lat, lng}

  -- Quote details
  status quote_status NOT NULL DEFAULT 'draft',
  contract_term INTEGER NOT NULL CHECK (contract_term IN (12, 24, 36)),  -- months

  -- Pricing
  subtotal_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal_installation DECIMAL(10,2) NOT NULL DEFAULT 0,
  custom_discount_percent DECIMAL(5,2) DEFAULT 0,
  custom_discount_amount DECIMAL(10,2) DEFAULT 0,
  custom_discount_reason TEXT,
  vat_amount_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount_installation DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_installation DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Notes
  admin_notes TEXT,  -- Private admin notes
  customer_notes TEXT,  -- Visible to customer (special terms, conditions)

  -- Validity
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),

  -- Workflow tracking
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Quote line items (multi-service support)
CREATE TABLE business_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,

  -- Package reference
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
  item_type quote_item_type NOT NULL DEFAULT 'primary',

  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  monthly_price DECIMAL(10,2) NOT NULL,
  installation_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  custom_pricing BOOLEAN DEFAULT FALSE,

  -- Service details
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  product_category TEXT NOT NULL,
  speed_down INTEGER,
  speed_up INTEGER,
  data_cap_gb INTEGER,

  -- Additional info
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote version history
CREATE TABLE business_quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot of quote at this version
  quote_data JSONB NOT NULL,  -- Full quote + items snapshot

  -- Change tracking
  changed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  change_summary TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(quote_id, version_number)
);

-- Digital signatures
CREATE TABLE business_quote_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,

  -- Signer information
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_id_number TEXT NOT NULL,
  signer_position TEXT,  -- Job title

  -- Signature data
  signature_type TEXT NOT NULL CHECK (signature_type IN ('drawn', 'typed')),
  signature_data TEXT NOT NULL,  -- Base64 canvas image or typed name

  -- Compliance confirmations
  fica_documents_confirmed BOOLEAN DEFAULT FALSE,
  cipc_documents_confirmed BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit trail
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Only one signature per quote
  UNIQUE(quote_id)
);

-- Standard terms & conditions templates
CREATE TABLE business_quote_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template categorization
  service_type TEXT NOT NULL,  -- fibre, 5g, wireless, lte, general
  contract_term INTEGER CHECK (contract_term IN (12, 24, 36)),  -- NULL = applies to all

  -- Terms content
  title TEXT NOT NULL,
  terms_text TEXT NOT NULL,  -- Markdown or HTML supported

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Business quotes indexes
CREATE INDEX idx_business_quotes_status ON business_quotes(status);
CREATE INDEX idx_business_quotes_quote_number ON business_quotes(quote_number);
CREATE INDEX idx_business_quotes_customer ON business_quotes(customer_id);
CREATE INDEX idx_business_quotes_lead ON business_quotes(lead_id);
CREATE INDEX idx_business_quotes_valid_until ON business_quotes(valid_until);
CREATE INDEX idx_business_quotes_created_at ON business_quotes(created_at DESC);
CREATE INDEX idx_business_quotes_company_name ON business_quotes(company_name);
CREATE INDEX idx_business_quotes_contact_email ON business_quotes(contact_email);

-- Quote items indexes
CREATE INDEX idx_business_quote_items_quote ON business_quote_items(quote_id);
CREATE INDEX idx_business_quote_items_package ON business_quote_items(package_id);
CREATE INDEX idx_business_quote_items_type ON business_quote_items(item_type);
CREATE INDEX idx_business_quote_items_order ON business_quote_items(quote_id, display_order);

-- Version history indexes
CREATE INDEX idx_business_quote_versions_quote ON business_quote_versions(quote_id);
CREATE INDEX idx_business_quote_versions_created ON business_quote_versions(created_at DESC);

-- Signatures indexes
CREATE INDEX idx_business_quote_signatures_quote ON business_quote_signatures(quote_id);
CREATE INDEX idx_business_quote_signatures_signed ON business_quote_signatures(signed_at DESC);

-- Terms indexes
CREATE INDEX idx_business_quote_terms_service_type ON business_quote_terms(service_type);
CREATE INDEX idx_business_quote_terms_active ON business_quote_terms(active);

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_business_quotes_updated_at
  BEFORE UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_quote_items_updated_at
  BEFORE UPDATE ON business_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_quote_terms_updated_at
  BEFORE UPDATE ON business_quote_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate quote number function
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  next_num INTEGER;
  quote_num TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM business_quotes
  WHERE quote_number LIKE 'BQ-' || year_part || '-%';

  -- Format as BQ-YYYY-NNN (zero-padded to 3 digits)
  quote_num := 'BQ-' || year_part || '-' || LPAD(next_num::TEXT, 3, '0');

  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate quote number on insert
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_business_quote_number
  BEFORE INSERT ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_number();

-- Calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  items_monthly DECIMAL(10,2);
  items_installation DECIMAL(10,2);
  discount_amount DECIMAL(10,2);
BEGIN
  -- Sum all line items
  SELECT
    COALESCE(SUM(monthly_price * quantity), 0),
    COALESCE(SUM(installation_price * quantity), 0)
  INTO items_monthly, items_installation
  FROM business_quote_items
  WHERE quote_id = NEW.id;

  -- Apply discount
  IF NEW.custom_discount_percent > 0 THEN
    discount_amount := items_monthly * (NEW.custom_discount_percent / 100);
  ELSIF NEW.custom_discount_amount > 0 THEN
    discount_amount := NEW.custom_discount_amount;
  ELSE
    discount_amount := 0;
  END IF;

  -- Calculate totals
  NEW.subtotal_monthly := items_monthly;
  NEW.subtotal_installation := items_installation;
  NEW.custom_discount_amount := discount_amount;
  NEW.vat_amount_monthly := (items_monthly - discount_amount) * 0.15;
  NEW.vat_amount_installation := items_installation * 0.15;
  NEW.total_monthly := (items_monthly - discount_amount) * 1.15;
  NEW.total_installation := items_installation * 1.15;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_business_quote_totals
  BEFORE INSERT OR UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_totals();

-- Create version snapshot on significant changes
CREATE OR REPLACE FUNCTION create_quote_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  quote_snapshot JSONB;
BEGIN
  -- Only create version on status changes or pricing changes
  IF (TG_OP = 'UPDATE' AND (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.total_monthly IS DISTINCT FROM NEW.total_monthly OR
    OLD.custom_discount_percent IS DISTINCT FROM NEW.custom_discount_percent
  )) THEN

    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM business_quote_versions
    WHERE quote_id = NEW.id;

    -- Create snapshot
    SELECT jsonb_build_object(
      'quote', row_to_json(NEW),
      'items', (
        SELECT jsonb_agg(row_to_json(i))
        FROM business_quote_items i
        WHERE i.quote_id = NEW.id
      )
    ) INTO quote_snapshot;

    -- Insert version
    INSERT INTO business_quote_versions (
      quote_id,
      version_number,
      quote_data,
      changed_by,
      change_summary
    ) VALUES (
      NEW.id,
      next_version,
      quote_snapshot,
      NEW.updated_by,
      'Status: ' || OLD.status || ' → ' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_business_quote_version
  AFTER UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_quote_version();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE business_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quote_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quote_terms ENABLE ROW LEVEL SECURITY;

-- Admin policies (full access)
CREATE POLICY "Admins can view all quotes"
  ON business_quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.active = TRUE
    )
  );

CREATE POLICY "Admins can manage quotes"
  ON business_quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.active = TRUE
    )
  );

-- Customer policies (view own quotes)
CREATE POLICY "Customers can view own quotes"
  ON business_quotes FOR SELECT
  TO authenticated
  USING (
    customer_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = business_quotes.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Public access for quote viewing (with token)
-- Note: Implement via API with signed URLs, not direct RLS

-- Quote items policies
CREATE POLICY "Anyone can view quote items for accessible quotes"
  ON business_quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_quotes
      WHERE business_quotes.id = business_quote_items.quote_id
    )
  );

-- Admins can manage quote items
CREATE POLICY "Admins can manage quote items"
  ON business_quote_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.active = TRUE
    )
  );

-- Version history (read-only, auto-generated)
CREATE POLICY "Admins can view quote versions"
  ON business_quote_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.active = TRUE
    )
  );

-- Signatures (customers can create, admins can view)
CREATE POLICY "Customers can sign own quotes"
  ON business_quote_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_quotes
      WHERE business_quotes.id = business_quote_signatures.quote_id
      AND business_quotes.customer_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = business_quotes.customer_id
        AND customers.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all signatures"
  ON business_quote_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.active = TRUE
    )
  );

-- Terms (public read, admin write)
CREATE POLICY "Anyone can view active terms"
  ON business_quote_terms FOR SELECT
  TO authenticated
  USING (active = TRUE);

CREATE POLICY "Admins can manage terms"
  ON business_quote_terms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.active = TRUE
    )
  );

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE business_quotes IS 'Business customer quotes with multi-service support and approval workflow';
COMMENT ON TABLE business_quote_items IS 'Individual service line items for business quotes';
COMMENT ON TABLE business_quote_versions IS 'Version history for quote changes and audit trail';
COMMENT ON TABLE business_quote_signatures IS 'Digital signatures for quote acceptance (ECT Act 2002 compliant)';
COMMENT ON TABLE business_quote_terms IS 'Standard terms and conditions templates for different service types';

COMMENT ON COLUMN business_quotes.quote_number IS 'Unique quote reference: BQ-YYYY-NNN';
COMMENT ON COLUMN business_quotes.contract_term IS 'Contract length in months: 12, 24, or 36';
COMMENT ON COLUMN business_quotes.valid_until IS 'Quote expiry date (default 30 days from creation)';
COMMENT ON COLUMN business_quote_items.custom_pricing IS 'True if pricing was manually adjusted by admin';
COMMENT ON COLUMN business_quote_signatures.signature_type IS 'drawn = canvas signature, typed = full name typed';
COMMENT ON COLUMN business_quote_signatures.fica_documents_confirmed IS 'Customer confirmed FICA documents uploaded';
COMMENT ON COLUMN business_quote_signatures.cipc_documents_confirmed IS 'Customer confirmed CIPC documents uploaded';
