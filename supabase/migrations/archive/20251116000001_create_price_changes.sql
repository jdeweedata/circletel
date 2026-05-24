-- ============================================================================
-- Price Changes System - Epic 3.6
-- ============================================================================
-- Purpose: Track scheduled price changes with 2-month notice period
-- Business Logic:
--   1. Admin publishes price change → 2-month notice begins
--   2. New customers (signup after publication) → Get new price immediately
--   3. Existing customers → Keep old price until effective_date
--   4. On effective_date → All customers switch to new price
-- ============================================================================

-- Create price_changes table
CREATE TABLE IF NOT EXISTS price_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Pricing Details
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  price_difference DECIMAL(10,2), -- Calculated: new_price - old_price
  percentage_change DECIMAL(5,2), -- Calculated: (difference / old_price) * 100

  -- Critical Dates
  published_at TIMESTAMPTZ,      -- When 2-month notice starts (status becomes 'published')
  effective_date DATE NOT NULL,  -- When price change takes effect (all customers switch)

  -- Status Workflow
  -- draft: Created but not yet published
  -- published: Published, 2-month notice period active
  -- effective: Effective date reached, price change applied
  -- cancelled: Cancelled before effective date
  status TEXT CHECK (status IN ('draft', 'published', 'effective', 'cancelled')) DEFAULT 'draft' NOT NULL,

  -- Communication Tracking
  notice_sent_at TIMESTAMPTZ,              -- Initial 2-month notice email sent
  reminder_1month_sent_at TIMESTAMPTZ,     -- 1-month reminder email sent
  reminder_1week_sent_at TIMESTAMPTZ,      -- 1-week reminder email sent

  -- Customer Impact Analytics
  affected_customers_count INTEGER DEFAULT 0,  -- Existing customers affected
  new_customers_count INTEGER DEFAULT 0,       -- New customers who got new price during notice period

  -- Admin Tracking
  created_by UUID REFERENCES admin_users(id),
  approved_by UUID REFERENCES admin_users(id),  -- Who published the price change

  -- Documentation
  reason TEXT,                    -- Internal reason for price change
  admin_notes TEXT,               -- Internal admin notes
  customer_message TEXT,          -- Message sent to customers in notification email

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Query price changes by package
CREATE INDEX idx_price_changes_package ON price_changes(service_package_id);

-- Filter by status
CREATE INDEX idx_price_changes_status ON price_changes(status);

-- Scheduled job queries (find price changes to make effective)
CREATE INDEX idx_price_changes_effective_date ON price_changes(effective_date);

-- Combined index for scheduled job
CREATE INDEX idx_price_changes_published_effective ON price_changes(status, effective_date)
WHERE status = 'published';

-- ============================================================================
-- Unique Constraint: Only 1 Active Price Change Per Package
-- ============================================================================
-- Prevents overlapping price changes for same package
-- A package can only have 1 published OR effective price change at a time

CREATE UNIQUE INDEX idx_price_changes_active_per_package
ON price_changes(service_package_id)
WHERE status IN ('published', 'effective');

-- ============================================================================
-- Add Price History to service_packages
-- ============================================================================
-- Stores historical pricing data for audit trail
-- Structure: [{ price: 799, effective_from: '2025-01-01', effective_to: '2025-03-31', change_id: 'uuid' }]

ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[]'::jsonb;

-- Index for querying price history
CREATE INDEX IF NOT EXISTS idx_service_packages_price_history
ON service_packages USING gin(price_history);

-- ============================================================================
-- Trigger: Auto-calculate price_difference and percentage_change
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_price_change_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate price difference
  NEW.price_difference := NEW.new_price - NEW.old_price;

  -- Calculate percentage change (avoid division by zero)
  IF NEW.old_price > 0 THEN
    NEW.percentage_change := ROUND(
      ((NEW.new_price - NEW.old_price) / NEW.old_price * 100)::numeric,
      2
    );
  ELSE
    NEW.percentage_change := 0;
  END IF;

  -- Update updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_price_change_metrics
BEFORE INSERT OR UPDATE ON price_changes
FOR EACH ROW
EXECUTE FUNCTION calculate_price_change_metrics();

-- ============================================================================
-- Trigger: Update service_packages.updated_at when price changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_service_package_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent service package's updated_at timestamp
  UPDATE service_packages
  SET updated_at = NOW()
  WHERE id = NEW.service_package_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_package_on_price_change
AFTER INSERT OR UPDATE ON price_changes
FOR EACH ROW
EXECUTE FUNCTION update_service_package_timestamp();

-- ============================================================================
-- Helper Function: Get Current Price for Customer
-- ============================================================================
-- Returns the applicable price for a customer based on signup date
-- Logic:
--   - If no published price change: Return current package price
--   - If customer signed up AFTER published_at: Return new price
--   - If customer signed up BEFORE published_at: Return old price (until effective_date)

CREATE OR REPLACE FUNCTION get_current_price_for_customer(
  p_service_package_id UUID,
  p_customer_signup_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_current_price DECIMAL(10,2);
  v_published_change RECORD;
BEGIN
  -- Get current package price
  SELECT price INTO v_current_price
  FROM service_packages
  WHERE id = p_service_package_id;

  -- Check for published price change
  SELECT * INTO v_published_change
  FROM price_changes
  WHERE service_package_id = p_service_package_id
    AND status = 'published'
  LIMIT 1;

  -- No published price change - return current price
  IF v_published_change IS NULL THEN
    RETURN v_current_price;
  END IF;

  -- Customer signed up AFTER price change published?
  IF p_customer_signup_date >= v_published_change.published_at THEN
    -- New customer gets new price immediately
    RETURN v_published_change.new_price;
  ELSE
    -- Existing customer keeps old price until effective_date
    RETURN v_published_change.old_price;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on price_changes table
ALTER TABLE price_changes ENABLE ROW LEVEL SECURITY;

-- Admin users can read all price changes
CREATE POLICY "Admin users can read all price changes"
ON price_changes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- Admin users with products:manage_pricing can create price changes
CREATE POLICY "Admin users can create price changes"
ON price_changes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- Admin users with products:approve can update price changes
CREATE POLICY "Admin users can update price changes"
ON price_changes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- Admin users with products:approve can delete price changes (draft only)
CREATE POLICY "Admin users can delete draft price changes"
ON price_changes
FOR DELETE
TO authenticated
USING (
  status = 'draft'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE price_changes IS 'Tracks scheduled price changes with 2-month notice period. New customers get new price immediately after publication, existing customers keep old price until effective date.';

COMMENT ON COLUMN price_changes.published_at IS 'When price change was published (2-month notice period begins)';
COMMENT ON COLUMN price_changes.effective_date IS 'When all customers (new + existing) switch to new price';
COMMENT ON COLUMN price_changes.status IS 'Workflow: draft → published → effective (or cancelled)';
COMMENT ON COLUMN price_changes.affected_customers_count IS 'Number of existing customers affected by this price change';
COMMENT ON COLUMN price_changes.new_customers_count IS 'Number of new customers who got new price during notice period';

COMMENT ON FUNCTION get_current_price_for_customer IS 'Returns applicable price for customer based on signup date. New customers (after published_at) get new price immediately, existing customers keep old price until effective_date.';
