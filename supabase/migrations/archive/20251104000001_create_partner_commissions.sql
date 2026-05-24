-- Migration: Create Partner Commission Transactions
-- Description: Creates detailed commission tracking for partners
-- Date: 2025-11-04

-- ============================================
-- PARTNER COMMISSION TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partner_commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,

  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('lead_conversion', 'monthly_recurring', 'installation_fee', 'upgrade', 'adjustment', 'payout')
  ),

  -- Related Records
  lead_id UUID REFERENCES coverage_leads(id),
  order_id UUID, -- Can reference consumer_orders or orders

  -- Financial Details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  commission_rate DECIMAL(5, 2), -- Percentage at time of transaction

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'paid', 'cancelled')
  ),

  -- Payment Details
  paid_at TIMESTAMPTZ,
  payment_method TEXT, -- eft, bank_transfer, etc.
  payment_reference TEXT,

  -- Metadata
  description TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Approval
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commission_transactions_partner_id
  ON partner_commission_transactions(partner_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_lead_id
  ON partner_commission_transactions(lead_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_order_id
  ON partner_commission_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_status
  ON partner_commission_transactions(status);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_created_at
  ON partner_commission_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_paid_at
  ON partner_commission_transactions(paid_at DESC) WHERE paid_at IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE partner_commission_transactions ENABLE ROW LEVEL SECURITY;

-- Partners can view their own commission transactions
CREATE POLICY "partners_view_own_commissions"
  ON partner_commission_transactions FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins can view all commission transactions
CREATE POLICY "admins_view_all_commissions"
  ON partner_commission_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Finance Manager')
      )
    )
  );

-- Admins can manage commission transactions
CREATE POLICY "admins_manage_commissions"
  ON partner_commission_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Finance Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Finance Manager')
      )
    )
  );

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update partner commission totals when transaction changes
CREATE OR REPLACE FUNCTION update_partner_commission_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- When transaction is approved, add to pending_commission
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    UPDATE partners
    SET pending_commission = pending_commission + NEW.amount
    WHERE id = NEW.partner_id;
  END IF;

  -- When transaction is paid, move from pending to total earned
  IF (TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid') THEN
    UPDATE partners
    SET
      pending_commission = pending_commission - NEW.amount,
      total_commission_earned = total_commission_earned + NEW.amount
    WHERE id = NEW.partner_id;
  END IF;

  -- When transaction is cancelled, subtract from pending
  IF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'approved') THEN
    UPDATE partners
    SET pending_commission = pending_commission - OLD.amount
    WHERE id = OLD.partner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for commission transactions
DROP TRIGGER IF EXISTS trigger_update_partner_commission_totals ON partner_commission_transactions;
CREATE TRIGGER trigger_update_partner_commission_totals
  AFTER INSERT OR UPDATE ON partner_commission_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_commission_totals();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commission_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_commission_transactions_updated_at ON partner_commission_transactions;
CREATE TRIGGER trigger_commission_transactions_updated_at
  BEFORE UPDATE ON partner_commission_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_transactions_updated_at();

-- ============================================
-- HELPER FUNCTION: Create commission for lead conversion
-- ============================================

CREATE OR REPLACE FUNCTION create_lead_conversion_commission(
  p_partner_id UUID,
  p_lead_id UUID,
  p_order_id UUID,
  p_amount DECIMAL,
  p_commission_rate DECIMAL,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO partner_commission_transactions (
    partner_id,
    lead_id,
    order_id,
    transaction_type,
    amount,
    commission_rate,
    status,
    description
  ) VALUES (
    p_partner_id,
    p_lead_id,
    p_order_id,
    'lead_conversion',
    p_amount,
    p_commission_rate,
    'pending',
    p_description
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE partner_commission_transactions IS 'Detailed commission transaction history for partners';
COMMENT ON COLUMN partner_commission_transactions.transaction_type IS 'Type of commission: lead_conversion, monthly_recurring, installation_fee, upgrade, adjustment, payout';
COMMENT ON COLUMN partner_commission_transactions.status IS 'Transaction status: pending (awaiting approval), approved (approved but not paid), paid (paid out), cancelled';
COMMENT ON FUNCTION create_lead_conversion_commission IS 'Helper function to create commission record when lead converts to order';

-- ============================================
-- SEED SAMPLE DATA (for testing)
-- ============================================

-- Note: In production, this would be created when orders are placed
-- For now, adding a comment showing how to create test data:

-- Example: Create sample commission for existing approved partners
-- INSERT INTO partner_commission_transactions (partner_id, transaction_type, amount, status, description)
-- SELECT
--   id,
--   'lead_conversion',
--   500.00,
--   'approved',
--   'Sample commission for testing'
-- FROM partners
-- WHERE status = 'approved'
-- LIMIT 5;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
