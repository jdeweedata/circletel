# Simple Migration Solution
## Apply B2B Workflow Database Schema

---

## 🎯 **Problem Summary**

The migration files have RLS policies that reference columns that might not exist in your database:
- `admin_users.status`
- `admin_users.role`
- Complex joins in RLS policies

---

## ✅ **SOLUTION: Disable RLS Temporarily**

The **fastest and safest** approach:

1. Apply all migrations **without** RLS policies (just create tables)
2. Add simplified RLS policies afterward

---

## 🚀 **Step-by-Step Instructions**

### **Step 1: Apply Table Structures Only**

Run this consolidated SQL in Supabase SQL Editor:

https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql

```sql
-- ============================================
-- B2B WORKFLOW - CONSOLIDATED MIGRATION
-- ============================================
-- This creates ALL tables needed for the B2B workflow
-- RLS policies are simplified to avoid column reference errors
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. KYC SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kyc_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,
  didit_session_id TEXT UNIQUE NOT NULL,
  flow_type TEXT CHECK (flow_type IN ('sme_light', 'consumer_light', 'full_kyc')) DEFAULT 'sme_light',
  user_type TEXT CHECK (user_type IN ('business', 'consumer')),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned', 'declined')) DEFAULT 'not_started',
  extracted_data JSONB,
  verification_result TEXT CHECK (verification_result IN ('approved', 'declined', 'pending_review')),
  risk_tier TEXT CHECK (risk_tier IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ,
  raw_webhook_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_kyc_didit_session ON kyc_sessions(didit_session_id);
CREATE INDEX IF NOT EXISTS idx_kyc_quote ON kyc_sessions(quote_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_sessions(status);

-- =====================================================
-- 2. RICA SUBMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rica_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kyc_session_id UUID REFERENCES kyc_sessions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
  iccid TEXT[],
  submitted_data JSONB,
  icasa_tracking_id TEXT,
  status TEXT CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
  icasa_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rica_tracking ON rica_submissions(icasa_tracking_id);
CREATE INDEX IF NOT EXISTS idx_rica_kyc_session ON rica_submissions(kyc_session_id);
CREATE INDEX IF NOT EXISTS idx_rica_order ON rica_submissions(order_id);

-- =====================================================
-- 3. PAYMENT WEBHOOKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_transaction_id ON payment_webhooks(transaction_id);

-- Add contract_id to consumer_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumer_orders' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE consumer_orders ADD COLUMN contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_consumer_orders_contract_id ON consumer_orders(contract_id);
  END IF;
END $$;

-- =====================================================
-- 4. CONTRACTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  kyc_session_id UUID REFERENCES kyc_sessions(id) ON DELETE SET NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('fibre', 'wireless', 'hybrid')),
  contract_term_months INTEGER NOT NULL CHECK (contract_term_months IN (12, 24, 36)),
  start_date DATE,
  end_date DATE,
  monthly_recurring DECIMAL(10,2) NOT NULL,
  once_off_fee DECIMAL(10,2) DEFAULT 0,
  installation_fee DECIMAL(10,2) DEFAULT 0,
  total_contract_value DECIMAL(10,2) NOT NULL,
  zoho_sign_request_id TEXT UNIQUE,
  customer_signature_date TIMESTAMPTZ,
  circletel_signature_date TIMESTAMPTZ,
  fully_signed_date TIMESTAMPTZ,
  signed_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_signature', 'partially_signed', 'fully_signed', 'active', 'expired', 'terminated')
  ),
  zoho_deal_id TEXT UNIQUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_quote ON contracts(quote_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_kyc_session ON contracts(kyc_session_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- =====================================================
-- 5. INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('one_time', 'recurring', 'installation')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled')
  ),
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,4) DEFAULT 0.15,
  vat_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================================================
-- 6. PAYMENT TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'eft', 'cash', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  netcash_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_netcash ON payment_transactions(netcash_reference);

-- =====================================================
-- 7. BILLING CYCLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (
    status IN ('upcoming', 'invoiced', 'paid', 'overdue', 'skipped')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_contract ON billing_cycles(contract_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_period ON billing_cycles(period_start, period_end);

-- =====================================================
-- 8. INSTALLATION SCHEDULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS installation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES consumer_orders(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time_slot TEXT,
  technician_id UUID,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')
  ),
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installation_order ON installation_schedules(order_id);
CREATE INDEX IF NOT EXISTS idx_installation_date ON installation_schedules(scheduled_date);

-- =====================================================
-- 9. AUTO-NUMBERING FUNCTIONS
-- =====================================================

-- Contract number generator
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_sequence INTEGER;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO next_sequence
  FROM contracts
  WHERE contract_number LIKE 'CT-' || current_year || '-%';
  RETURN 'CT-' || current_year || '-' || LPAD(next_sequence::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Invoice number generator
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_sequence INTEGER;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO next_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';
  RETURN 'INV-' || current_year || '-' || LPAD(next_sequence::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. TRIGGERS FOR AUTO-NUMBERING
-- =====================================================

-- Contract number trigger
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := generate_contract_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contract_number_trigger ON contracts;
CREATE TRIGGER set_contract_number_trigger
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_number();

-- Invoice number trigger
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number_trigger ON invoices;
CREATE TRIGGER set_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- =====================================================
-- 11. SIMPLE RLS POLICIES (Service Role Only)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE kyc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rica_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_schedules ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY['kyc_sessions', 'rica_submissions', 'payment_webhooks', 
                        'contracts', 'invoices', 'payment_transactions',
                        'billing_cycles', 'installation_schedules'])
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS service_role_all ON ' || tbl;
  END LOOP;
END $$;

-- Service role can do everything (for API operations)
CREATE POLICY service_role_all ON kyc_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON rica_submissions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON payment_webhooks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON contracts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON payment_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON billing_cycles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON installation_schedules FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- DONE!
-- =====================================================
```

---

### **Step 2: Verify All Tables Created**

```sql
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'kyc_sessions',
  'rica_submissions',
  'payment_webhooks',
  'contracts',
  'invoices',
  'payment_transactions',
  'billing_cycles',
  'installation_schedules'
)
ORDER BY table_name;
```

**Expected**: 8 rows

---

### **Step 3: Test Auto-Numbering**

```sql
-- Test contract number generation
SELECT generate_contract_number();
-- Should return: CT-2025-001

-- Test invoice number generation
SELECT generate_invoice_number();
-- Should return: INV-2025-001
```

---

## ✅ **Benefits of This Approach**

1. **Single SQL script** - Copy/paste once, done
2. **No column reference errors** - Uses simple service_role checks
3. **All tables created** - Complete B2B workflow schema
4. **Auto-numbering works** - Triggers installed
5. **RLS enabled** - Secure by default

---

## 🎯 **After Migration**

Once tables are created, you can add more granular RLS policies later if needed. But for now, the API (using service role key) can access everything securely.

---

## 📞 **If You Get Errors**

**"relation already exists"**: 
```sql
DROP TABLE IF EXISTS <table_name> CASCADE;
-- Then re-run the migration
```

**"unique constraint violation"**:
- Some data already exists, this is OK
- The `IF NOT EXISTS` and `IF NOT EXISTS` clauses prevent most duplicate errors

---

**Ready to apply? Copy the SQL above into Supabase SQL Editor and click "Run"!** 🚀
