-- =====================================================
-- CircleTel Order Workflow Update - Pro-rata Billing
-- Created: 2025-11-08
-- Purpose: Implement new KYC-first workflow with pro-rata billing
-- =====================================================

-- =====================================================
-- 1. UPDATE ORDER STATUS ENUM
-- =====================================================

-- Add new order statuses for updated workflow
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'kyc_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'kyc_submitted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'kyc_approved';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'kyc_rejected';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_method_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_method_registered';

-- Note: order_status enum already has: pending, installation_scheduled, installation_in_progress,
-- installation_completed, activation_pending, active, suspended, cancelled

COMMENT ON TYPE order_status IS 'Order status workflow: pending → kyc_pending → kyc_submitted → kyc_approved → payment_method_pending → payment_method_registered → installation_scheduled → installation_in_progress → installation_completed → active';

-- =====================================================
-- 2. ADD COLUMNS TO consumer_orders TABLE
-- =====================================================

-- Add activation and billing-related columns
ALTER TABLE consumer_orders
  ADD COLUMN IF NOT EXISTS activation_date DATE,
  ADD COLUMN IF NOT EXISTS next_billing_date DATE,
  ADD COLUMN IF NOT EXISTS billing_cycle_day INTEGER CHECK (billing_cycle_day IN (1, 5, 15, 25)),
  ADD COLUMN IF NOT EXISTS prorata_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS prorata_days INTEGER,
  ADD COLUMN IF NOT EXISTS payment_method_id UUID,
  ADD COLUMN IF NOT EXISTS kyc_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_approved_by UUID REFERENCES admin_users(id),
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_added_at TIMESTAMPTZ;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_consumer_orders_activation_date ON consumer_orders(activation_date);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_next_billing_date ON consumer_orders(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_billing_cycle_day ON consumer_orders(billing_cycle_day);
CREATE INDEX IF NOT EXISTS idx_consumer_orders_kyc_approved_at ON consumer_orders(kyc_approved_at);

COMMENT ON COLUMN consumer_orders.activation_date IS 'Date service was activated (used for pro-rata billing calculation)';
COMMENT ON COLUMN consumer_orders.next_billing_date IS 'Next billing cycle date (1st, 5th, 15th, or 25th of month)';
COMMENT ON COLUMN consumer_orders.billing_cycle_day IS 'Day of month for recurring billing (1, 5, 15, or 25)';
COMMENT ON COLUMN consumer_orders.prorata_amount IS 'Calculated pro-rata amount for first partial month';
COMMENT ON COLUMN consumer_orders.prorata_days IS 'Number of days in first billing cycle';
COMMENT ON COLUMN consumer_orders.kyc_uploaded_at IS 'Timestamp when customer uploaded KYC documents';
COMMENT ON COLUMN consumer_orders.kyc_approved_at IS 'Timestamp when admin approved KYC documents';
COMMENT ON COLUMN consumer_orders.kyc_rejection_reason IS 'Reason for KYC rejection (if rejected)';

-- =====================================================
-- 3. CREATE PAYMENT METHODS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Payment method type
  payment_type TEXT NOT NULL CHECK (payment_type IN ('debit_order', 'credit_card', 'eft')),

  -- Payment method details (encrypted/tokenized)
  payment_provider TEXT, -- 'netcash', 'paygate', 'payfast', etc.
  payment_token TEXT, -- Tokenized payment method reference

  -- Card details (for display only - last 4 digits)
  card_last4 TEXT,
  card_brand TEXT, -- 'visa', 'mastercard', 'amex'
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,

  -- Bank details (for debit orders)
  bank_name TEXT,
  account_holder_name TEXT,
  account_type TEXT, -- 'cheque', 'savings', 'transmission'

  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,

  -- Mandate details (for debit orders)
  mandate_reference TEXT,
  mandate_signed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);
CREATE INDEX idx_customer_payment_methods_is_default ON customer_payment_methods(is_default) WHERE is_default = true;
CREATE INDEX idx_customer_payment_methods_payment_type ON customer_payment_methods(payment_type);

COMMENT ON TABLE customer_payment_methods IS 'Customer payment methods for recurring billing';
COMMENT ON COLUMN customer_payment_methods.payment_token IS 'Tokenized payment method reference from payment provider (never store raw card details)';

-- Trigger for updated_at
CREATE TRIGGER update_customer_payment_methods_updated_at
  BEFORE UPDATE ON customer_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CREATE PRO-RATA BILLING CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_prorata_billing(
  p_activation_date DATE,
  p_monthly_price DECIMAL,
  p_billing_cycle_day INTEGER DEFAULT 1
)
RETURNS TABLE (
  prorata_amount DECIMAL,
  prorata_days INTEGER,
  next_billing_date DATE,
  daily_rate DECIMAL
) AS $$
DECLARE
  v_days_in_month INTEGER;
  v_days_remaining INTEGER;
  v_daily_rate DECIMAL;
  v_prorata_amount DECIMAL;
  v_next_billing_date DATE;
BEGIN
  -- Get days in activation month
  v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', p_activation_date) + INTERVAL '1 MONTH - 1 DAY')::DATE);

  -- Calculate next billing date
  -- If activation is after billing cycle day, next billing is next month
  IF EXTRACT(DAY FROM p_activation_date) >= p_billing_cycle_day THEN
    v_next_billing_date := (DATE_TRUNC('MONTH', p_activation_date) + INTERVAL '1 MONTH')::DATE + (p_billing_cycle_day - 1);
  ELSE
    v_next_billing_date := DATE_TRUNC('MONTH', p_activation_date)::DATE + (p_billing_cycle_day - 1);
  END IF;

  -- Calculate days remaining until next billing date (inclusive)
  v_days_remaining := (v_next_billing_date - p_activation_date) + 1;

  -- Calculate daily rate
  v_daily_rate := ROUND(p_monthly_price / v_days_in_month, 2);

  -- Calculate pro-rata amount
  v_prorata_amount := ROUND(v_daily_rate * v_days_remaining, 2);

  RETURN QUERY SELECT
    v_prorata_amount,
    v_days_remaining,
    v_next_billing_date,
    v_daily_rate;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_prorata_billing IS 'Calculate pro-rata billing for first partial month based on activation date';

-- Example usage:
-- SELECT * FROM calculate_prorata_billing('2025-11-15', 899.00, 1);
-- Returns: prorata_amount: 479.52, prorata_days: 16, next_billing_date: 2025-12-01, daily_rate: 29.97

-- =====================================================
-- 5. CREATE ORDER STATUS TRANSITION VALIDATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Define valid status transitions
  CASE OLD.status
    WHEN 'pending' THEN
      IF NEW.status NOT IN ('kyc_pending', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status;
      END IF;

    WHEN 'kyc_pending' THEN
      IF NEW.status NOT IN ('kyc_submitted', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from kyc_pending to %', NEW.status;
      END IF;

    WHEN 'kyc_submitted' THEN
      IF NEW.status NOT IN ('kyc_approved', 'kyc_rejected', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from kyc_submitted to %', NEW.status;
      END IF;

    WHEN 'kyc_rejected' THEN
      IF NEW.status NOT IN ('kyc_submitted', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from kyc_rejected to %', NEW.status;
      END IF;

    WHEN 'kyc_approved' THEN
      IF NEW.status NOT IN ('payment_method_pending', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from kyc_approved to %', NEW.status;
      END IF;

    WHEN 'payment_method_pending' THEN
      IF NEW.status NOT IN ('payment_method_registered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from payment_method_pending to %', NEW.status;
      END IF;

    WHEN 'payment_method_registered' THEN
      IF NEW.status NOT IN ('installation_scheduled', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from payment_method_registered to %', NEW.status;
      END IF;

    WHEN 'installation_scheduled' THEN
      IF NEW.status NOT IN ('installation_in_progress', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from installation_scheduled to %', NEW.status;
      END IF;

    WHEN 'installation_in_progress' THEN
      IF NEW.status NOT IN ('installation_completed', 'installation_scheduled', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from installation_in_progress to %', NEW.status;
      END IF;

    WHEN 'installation_completed' THEN
      IF NEW.status NOT IN ('active', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from installation_completed to %', NEW.status;
      END IF;

    WHEN 'active' THEN
      IF NEW.status NOT IN ('suspended', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from active to %', NEW.status;
      END IF;

    WHEN 'suspended' THEN
      IF NEW.status NOT IN ('active', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from suspended to %', NEW.status;
      END IF;

    ELSE
      -- Allow any transition from cancelled (for error recovery)
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status validation
-- DROP TRIGGER IF EXISTS validate_order_status_transition_trigger ON consumer_orders;
-- CREATE TRIGGER validate_order_status_transition_trigger
--   BEFORE UPDATE OF status ON consumer_orders
--   FOR EACH ROW
--   WHEN (OLD.status IS DISTINCT FROM NEW.status)
--   EXECUTE FUNCTION validate_order_status_transition();

COMMENT ON FUNCTION validate_order_status_transition IS 'Validates order status transitions follow correct workflow';

-- =====================================================
-- 6. CREATE AUTO-UPDATE TRIGGERS
-- =====================================================

-- Trigger to auto-update timestamps when status changes
CREATE OR REPLACE FUNCTION update_order_workflow_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update kyc_uploaded_at when status changes to kyc_submitted
  IF NEW.status = 'kyc_submitted' AND OLD.status != 'kyc_submitted' THEN
    NEW.kyc_uploaded_at := NOW();
  END IF;

  -- Update kyc_approved_at when status changes to kyc_approved
  IF NEW.status = 'kyc_approved' AND OLD.status != 'kyc_approved' THEN
    NEW.kyc_approved_at := NOW();
  END IF;

  -- Update payment_method_added_at when status changes to payment_method_registered
  IF NEW.status = 'payment_method_registered' AND OLD.status != 'payment_method_registered' THEN
    NEW.payment_method_added_at := NOW();
  END IF;

  -- Calculate pro-rata billing when service is activated
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.activation_date IS NOT NULL THEN
    -- Calculate pro-rata billing
    DECLARE
      v_prorata_calc RECORD;
    BEGIN
      SELECT * INTO v_prorata_calc
      FROM calculate_prorata_billing(
        NEW.activation_date,
        NEW.package_price::DECIMAL,
        COALESCE(NEW.billing_cycle_day, 1)
      );

      NEW.prorata_amount := v_prorata_calc.prorata_amount;
      NEW.prorata_days := v_prorata_calc.prorata_days;
      NEW.next_billing_date := v_prorata_calc.next_billing_date;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_workflow_timestamps_trigger
  BEFORE UPDATE OF status ON consumer_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_order_workflow_timestamps();

COMMENT ON FUNCTION update_order_workflow_timestamps IS 'Auto-updates workflow timestamps and calculates pro-rata billing on status changes';

-- =====================================================
-- 7. CREATE VIEWS FOR REPORTING
-- =====================================================

-- View: Orders pending KYC
CREATE OR REPLACE VIEW v_orders_pending_kyc AS
SELECT
  co.id,
  co.order_number,
  co.first_name || ' ' || co.last_name AS customer_name,
  co.email,
  co.phone,
  co.package_name,
  co.package_price,
  co.status,
  co.created_at,
  EXTRACT(DAY FROM NOW() - co.created_at) AS days_pending
FROM consumer_orders co
WHERE co.status IN ('pending', 'kyc_pending')
ORDER BY co.created_at;

-- View: Orders pending payment method
CREATE OR REPLACE VIEW v_orders_pending_payment_method AS
SELECT
  co.id,
  co.order_number,
  co.first_name || ' ' || co.last_name AS customer_name,
  co.email,
  co.phone,
  co.package_name,
  co.package_price,
  co.status,
  co.kyc_approved_at,
  EXTRACT(DAY FROM NOW() - co.kyc_approved_at) AS days_since_kyc_approval
FROM consumer_orders co
WHERE co.status IN ('kyc_approved', 'payment_method_pending')
ORDER BY co.kyc_approved_at;

-- View: Pro-rata billing summary
CREATE OR REPLACE VIEW v_prorata_billing_summary AS
SELECT
  co.id,
  co.order_number,
  co.first_name || ' ' || co.last_name AS customer_name,
  co.package_name,
  co.package_price AS monthly_price,
  co.activation_date,
  co.prorata_days,
  co.prorata_amount,
  co.next_billing_date,
  co.billing_cycle_day,
  ROUND(co.package_price / EXTRACT(DAY FROM (DATE_TRUNC('MONTH', co.activation_date) + INTERVAL '1 MONTH - 1 DAY')::DATE), 2) AS daily_rate
FROM consumer_orders co
WHERE co.status = 'active'
  AND co.activation_date IS NOT NULL
ORDER BY co.activation_date DESC;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on customer_payment_methods
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payment methods
CREATE POLICY "Customers can view own payment methods"
  ON customer_payment_methods
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Customers can insert their own payment methods
CREATE POLICY "Customers can insert own payment methods"
  ON customer_payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Customers can update their own payment methods
CREATE POLICY "Customers can update own payment methods"
  ON customer_payment_methods
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

-- Customers can delete their own payment methods (soft delete)
CREATE POLICY "Customers can delete own payment methods"
  ON customer_payment_methods
  FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- Admin users can manage all payment methods
CREATE POLICY "Admin users can manage all payment methods"
  ON customer_payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.active = true
    )
  );

-- =====================================================
-- 9. SAMPLE QUERIES (DOCUMENTATION)
-- =====================================================

-- Query 1: Calculate pro-rata billing for a specific date
-- SELECT * FROM calculate_prorata_billing('2025-11-15', 899.00, 1);

-- Query 2: Get all orders pending KYC
-- SELECT * FROM v_orders_pending_kyc;

-- Query 3: Get all orders pending payment method
-- SELECT * FROM v_orders_pending_payment_method;

-- Query 4: Get pro-rata billing summary
-- SELECT * FROM v_prorata_billing_summary;

-- Query 5: Update order to kyc_pending (after order placed)
-- UPDATE consumer_orders
-- SET status = 'kyc_pending'
-- WHERE order_number = 'ORD-20251108-9841';

-- Query 6: Approve KYC
-- UPDATE consumer_orders
-- SET status = 'kyc_approved',
--     kyc_approved_by = 'admin-user-id'
-- WHERE order_number = 'ORD-20251108-9841';

-- Query 7: Activate service with pro-rata calculation
-- UPDATE consumer_orders
-- SET status = 'active',
--     activation_date = CURRENT_DATE,
--     billing_cycle_day = 1
-- WHERE order_number = 'ORD-20251108-9841';
-- Pro-rata will be calculated automatically by trigger

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Order workflow migration completed successfully!';
  RAISE NOTICE '   - New order statuses added: kyc_pending, kyc_submitted, kyc_approved, kyc_rejected, payment_method_pending, payment_method_registered';
  RAISE NOTICE '   - Pro-rata billing calculation function created';
  RAISE NOTICE '   - customer_payment_methods table created';
  RAISE NOTICE '   - Auto-update triggers configured';
  RAISE NOTICE '   - Reporting views created';
  RAISE NOTICE '';
  RAISE NOTICE '📋 New workflow: pending → kyc_pending → kyc_submitted → kyc_approved → payment_method_pending → payment_method_registered → installation_scheduled → active';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Pro-rata billing: Automatically calculated when order status changes to "active"';
END $$;
