-- Customer Dashboard Schema
-- Creates tables and views for customer portal functionality

-- Customer services table (tracks active subscriptions)
CREATE TABLE IF NOT EXISTS customer_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Service details
  package_id UUID REFERENCES service_packages(id),
  package_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'fibre', 'lte', '5g', 'wireless'
  product_category VARCHAR(100), -- 'fibre_consumer', 'fibre_business', etc.
  
  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Service status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'cancelled'
  active BOOLEAN DEFAULT true,
  
  -- Installation details
  installation_address TEXT,
  installation_date DATE,
  activation_date DATE,
  
  -- Technical details
  speed_down INTEGER, -- Mbps
  speed_up INTEGER, -- Mbps
  data_cap_gb INTEGER, -- null for uncapped
  
  -- Provider information
  provider_code VARCHAR(50),
  provider_name VARCHAR(100),
  
  -- Contract
  contract_months INTEGER DEFAULT 0, -- 0 for month-to-month
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_customer_services_customer ON customer_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_status ON customer_services(status);
CREATE INDEX IF NOT EXISTS idx_customer_services_active ON customer_services(active) WHERE active = true;

-- Customer billing table
CREATE TABLE IF NOT EXISTS customer_billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Account balance
  account_balance DECIMAL(10, 2) DEFAULT 0.00,
  credit_limit DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Payment method
  payment_method VARCHAR(50), -- 'credit_card', 'debit_order', 'eft', 'cash'
  payment_method_details JSONB, -- { last4: '1234', brand: 'visa', exp_month: 12, exp_year: 2025 }
  
  -- Billing cycle
  billing_day INTEGER DEFAULT 1, -- Day of month for billing
  next_billing_date DATE,
  last_billing_date DATE,
  
  -- Payment status
  payment_status VARCHAR(50) DEFAULT 'current', -- 'current', 'overdue', 'suspended'
  days_overdue INTEGER DEFAULT 0,
  
  -- Zoho integration
  zoho_customer_id VARCHAR(100),
  zoho_subscription_id VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_billing_status ON customer_billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_customer_billing_next_date ON customer_billing(next_billing_date);

-- Customer invoices table
CREATE TABLE IF NOT EXISTS customer_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Invoice details
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  amount_due DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  paid_at TIMESTAMPTZ,
  
  -- Zoho integration
  zoho_invoice_id VARCHAR(100),
  zoho_pdf_url TEXT,
  
  -- Line items
  line_items JSONB, -- Array of { description, quantity, unit_price, amount }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer ON customer_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_date ON customer_invoices(invoice_date DESC);

-- Customer usage tracking (for services with data caps)
CREATE TABLE IF NOT EXISTS customer_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES customer_services(id) ON DELETE CASCADE,
  
  -- Usage period
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Data usage
  data_used_gb DECIMAL(10, 2) DEFAULT 0.00,
  data_limit_gb INTEGER,
  
  -- Usage details
  peak_usage_gb DECIMAL(10, 2) DEFAULT 0.00,
  off_peak_usage_gb DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, service_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_customer_usage_customer ON customer_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_usage_period ON customer_usage(year DESC, month DESC);

-- Dashboard summary view
CREATE OR REPLACE VIEW customer_dashboard_summary AS
SELECT 
  c.id as customer_id,
  c.email,
  c.first_name,
  c.last_name,
  c.phone,
  c.created_at as customer_since,
  
  -- Active services count
  (SELECT COUNT(*) FROM customer_services WHERE customer_id = c.id AND active = true) as active_services_count,
  
  -- Primary service (most recent active)
  (SELECT json_build_object(
    'id', cs.id,
    'package_name', cs.package_name,
    'service_type', cs.service_type,
    'status', cs.status,
    'monthly_price', cs.monthly_price,
    'installation_address', cs.installation_address,
    'speed_down', cs.speed_down,
    'speed_up', cs.speed_up
  ) FROM customer_services cs 
   WHERE cs.customer_id = c.id AND cs.active = true 
   ORDER BY cs.created_at DESC LIMIT 1) as primary_service,
  
  -- Billing info
  (SELECT json_build_object(
    'account_balance', cb.account_balance,
    'payment_method', cb.payment_method,
    'payment_status', cb.payment_status,
    'next_billing_date', cb.next_billing_date,
    'days_overdue', cb.days_overdue
  ) FROM customer_billing cb WHERE cb.customer_id = c.id) as billing_info,
  
  -- Recent orders
  (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE customer_id = c.id AND status = 'pending') as pending_orders,
  
  -- Recent invoices
  (SELECT COUNT(*) FROM customer_invoices WHERE customer_id = c.id AND status = 'overdue') as overdue_invoices
  
FROM customers c;

-- Enable RLS
ALTER TABLE customer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_services
CREATE POLICY "Customers can view own services" ON customer_services
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access services" ON customer_services
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for customer_billing
CREATE POLICY "Customers can view own billing" ON customer_billing
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access billing" ON customer_billing
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for customer_invoices
CREATE POLICY "Customers can view own invoices" ON customer_invoices
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access invoices" ON customer_invoices
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for customer_usage
CREATE POLICY "Customers can view own usage" ON customer_usage
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access usage" ON customer_usage
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE customer_services IS 'Tracks customer active services and subscriptions';
COMMENT ON TABLE customer_billing IS 'Customer billing information and payment methods';
COMMENT ON TABLE customer_invoices IS 'Customer invoices and payment history';
COMMENT ON TABLE customer_usage IS 'Data usage tracking for services with caps';
COMMENT ON VIEW customer_dashboard_summary IS 'Aggregated customer dashboard data';
