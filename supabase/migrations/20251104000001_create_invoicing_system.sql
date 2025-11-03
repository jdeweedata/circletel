-- Migration: Create Invoicing System
-- Created: 2025-11-04
-- Description: Invoices, payment transactions, billing cycles, and payment methods tables with RLS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- TABLE: invoices
-- ============================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL, -- INV-YYYY-NNN
  contract_id UUID REFERENCES contracts(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id),

  -- Invoice Type
  invoice_type TEXT CHECK (invoice_type IN ('installation', 'recurring', 'once_off')) DEFAULT 'installation',
  billing_cycle_id UUID REFERENCES billing_cycles(id),

  -- Line Items (JSONB)
  items JSONB NOT NULL, -- [{ description, quantity, unit_price, total }]

  -- Totals
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 15.00,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Payment Status
  status TEXT CHECK (status IN ('draft', 'sent', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  payment_method TEXT CHECK (payment_method IN ('eft', 'card', 'debit_order', 'cash', 'capitec_pay', 'instant_eft')),
  payment_reference TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,

  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,

  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- TABLE: payment_transactions
-- ============================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id),

  -- Transaction Details
  transaction_id TEXT UNIQUE NOT NULL, -- NetCash transaction ID
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  payment_method TEXT CHECK (payment_method IN ('eft', 'card', 'debit_order', 'cash', 'capitec_pay', 'instant_eft')),

  -- Status
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',

  -- NetCash Integration
  netcash_reference TEXT,
  netcash_response JSONB,
  webhook_received_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================
-- TABLE: billing_cycles
-- ============================
CREATE TABLE IF NOT EXISTS billing_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),

  -- Cycle Details
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  recurring_amount DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- TABLE: payment_methods
-- ============================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Method Type
  method_type TEXT CHECK (method_type IN ('card', 'bank_account', 'debit_order')) NOT NULL,

  -- Card Details (masked)
  card_last_four TEXT,
  card_brand TEXT, -- 'Visa', 'Mastercard', 'Amex'
  card_expiry TEXT, -- 'MM/YY'

  -- Bank Account Details (masked)
  bank_name TEXT,
  account_last_four TEXT,

  -- Debit Order
  debit_order_day INTEGER CHECK (debit_order_day BETWEEN 1 AND 31),

  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- INDEXES
-- ============================

-- Invoices indexes
CREATE INDEX idx_invoices_contract ON invoices(contract_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

-- Billing cycles indexes
CREATE INDEX idx_billing_cycles_contract ON billing_cycles(contract_id);
CREATE INDEX idx_billing_cycles_customer ON billing_cycles(customer_id);
CREATE INDEX idx_billing_cycles_status ON billing_cycles(status);

-- Payment methods indexes
CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(is_default) WHERE is_default = TRUE;

-- ============================
-- FUNCTION: generate_invoice_number()
-- ============================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num TEXT;
  next_sequence INTEGER;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Count existing invoices for current year
  SELECT COUNT(*) + 1
  INTO next_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';

  -- Pad sequence to 3 digits (001, 002, etc.)
  sequence_num := LPAD(next_sequence::TEXT, 3, '0');

  -- Return formatted invoice number
  RETURN 'INV-' || current_year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- TRIGGER: set_invoice_number()
-- ============================
CREATE OR REPLACE FUNCTION trigger_set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate invoice number if not provided
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_invoice
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_invoice_number();

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================

-- Enable RLS on all tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================
-- RLS POLICIES: invoices
-- ============================

-- Customers SELECT own invoices
CREATE POLICY "customers_select_own_invoices" ON invoices
FOR SELECT USING (customer_id = auth.uid());

-- Customers INSERT own invoices (for self-service)
CREATE POLICY "customers_insert_own_invoices" ON invoices
FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Admins ALL operations
CREATE POLICY "admins_all_invoices" ON invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'finance')
  )
);

-- Service role for system operations
CREATE POLICY "service_role_all_invoices" ON invoices
FOR ALL USING (auth.role() = 'service_role');

-- ============================
-- RLS POLICIES: payment_transactions
-- ============================

-- Customers SELECT own transactions
CREATE POLICY "customers_select_own_transactions" ON payment_transactions
FOR SELECT USING (customer_id = auth.uid());

-- Service role for webhook processing
CREATE POLICY "service_role_all_transactions" ON payment_transactions
FOR ALL USING (auth.role() = 'service_role');

-- Admins ALL operations
CREATE POLICY "admins_all_transactions" ON payment_transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'finance')
  )
);

-- ============================
-- RLS POLICIES: billing_cycles
-- ============================

-- Customers SELECT own billing cycles
CREATE POLICY "customers_select_own_billing_cycles" ON billing_cycles
FOR SELECT USING (customer_id = auth.uid());

-- Service role for automated billing operations
CREATE POLICY "service_role_all_billing_cycles" ON billing_cycles
FOR ALL USING (auth.role() = 'service_role');

-- Admins ALL operations
CREATE POLICY "admins_all_billing_cycles" ON billing_cycles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'finance')
  )
);

-- ============================
-- RLS POLICIES: payment_methods
-- ============================

-- Customers SELECT own payment methods
CREATE POLICY "customers_select_own_payment_methods" ON payment_methods
FOR SELECT USING (customer_id = auth.uid());

-- Customers INSERT own payment methods
CREATE POLICY "customers_insert_own_payment_methods" ON payment_methods
FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Customers UPDATE own payment methods
CREATE POLICY "customers_update_own_payment_methods" ON payment_methods
FOR UPDATE USING (customer_id = auth.uid());

-- Customers DELETE own payment methods
CREATE POLICY "customers_delete_own_payment_methods" ON payment_methods
FOR DELETE USING (customer_id = auth.uid());

-- Service role for payment processing
CREATE POLICY "service_role_all_payment_methods" ON payment_methods
FOR ALL USING (auth.role() = 'service_role');

-- Admins ALL operations
CREATE POLICY "admins_all_payment_methods" ON payment_methods
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'finance')
  )
);

-- ============================
-- ROLLBACK INSTRUCTIONS (commented)
-- ============================

-- To rollback this migration, run the following:
-- DROP TRIGGER IF EXISTS before_insert_invoice ON invoices;
-- DROP FUNCTION IF EXISTS trigger_set_invoice_number();
-- DROP FUNCTION IF EXISTS generate_invoice_number();
-- DROP POLICY IF EXISTS "admins_all_payment_methods" ON payment_methods;
-- DROP POLICY IF EXISTS "service_role_all_payment_methods" ON payment_methods;
-- DROP POLICY IF EXISTS "customers_delete_own_payment_methods" ON payment_methods;
-- DROP POLICY IF EXISTS "customers_update_own_payment_methods" ON payment_methods;
-- DROP POLICY IF EXISTS "customers_insert_own_payment_methods" ON payment_methods;
-- DROP POLICY IF EXISTS "customers_select_own_payment_methods" ON payment_methods;
-- DROP POLICY IF EXISTS "admins_all_billing_cycles" ON billing_cycles;
-- DROP POLICY IF EXISTS "service_role_all_billing_cycles" ON billing_cycles;
-- DROP POLICY IF EXISTS "customers_select_own_billing_cycles" ON billing_cycles;
-- DROP POLICY IF EXISTS "admins_all_transactions" ON payment_transactions;
-- DROP POLICY IF EXISTS "service_role_all_transactions" ON payment_transactions;
-- DROP POLICY IF EXISTS "customers_select_own_transactions" ON payment_transactions;
-- DROP POLICY IF EXISTS "service_role_all_invoices" ON invoices;
-- DROP POLICY IF EXISTS "admins_all_invoices" ON invoices;
-- DROP POLICY IF EXISTS "customers_insert_own_invoices" ON invoices;
-- DROP POLICY IF EXISTS "customers_select_own_invoices" ON invoices;
-- DROP INDEX IF EXISTS idx_payment_methods_default;
-- DROP INDEX IF EXISTS idx_payment_methods_customer;
-- DROP INDEX IF EXISTS idx_billing_cycles_status;
-- DROP INDEX IF EXISTS idx_billing_cycles_customer;
-- DROP INDEX IF EXISTS idx_billing_cycles_contract;
-- DROP INDEX IF EXISTS idx_payment_transactions_transaction_id;
-- DROP INDEX IF EXISTS idx_payment_transactions_status;
-- DROP INDEX IF EXISTS idx_payment_transactions_customer;
-- DROP INDEX IF EXISTS idx_payment_transactions_invoice;
-- DROP INDEX IF EXISTS idx_invoices_invoice_number;
-- DROP INDEX IF EXISTS idx_invoices_due_date;
-- DROP INDEX IF EXISTS idx_invoices_status;
-- DROP INDEX IF EXISTS idx_invoices_customer;
-- DROP INDEX IF EXISTS idx_invoices_contract;
-- DROP TABLE IF EXISTS payment_methods;
-- DROP TABLE IF EXISTS billing_cycles;
-- DROP TABLE IF EXISTS payment_transactions;
-- DROP TABLE IF EXISTS invoices;
