-- Migration: CPQ (Configure, Price, Quote) System
-- Creates tables for AI-powered quote configuration with role-based pricing controls

-- ============================================================================
-- TABLE 1: cpq_discount_limits
-- Purpose: Role-based discount limits matrix
-- ============================================================================

CREATE TABLE IF NOT EXISTS cpq_discount_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Role identification (supports both partner tiers and admin roles)
  role_type TEXT NOT NULL CHECK (role_type IN ('partner', 'admin')),
  role_name TEXT NOT NULL, -- e.g., 'bronze', 'silver', 'gold', 'platinum', 'sales_rep', 'sales_manager', 'director'

  -- Discount limits (percentages)
  max_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (max_discount_percent >= 0 AND max_discount_percent <= 100),
  approval_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (approval_threshold_percent >= 0 AND approval_threshold_percent <= max_discount_percent),

  -- Can this role approve discounts?
  can_approve_discounts BOOLEAN DEFAULT false,
  max_approvable_discount DECIMAL(5,2) DEFAULT 0 CHECK (max_approvable_discount >= 0 AND max_approvable_discount <= 100),

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique role combination
  UNIQUE(role_type, role_name)
);

-- Seed default discount limits
INSERT INTO cpq_discount_limits (role_type, role_name, max_discount_percent, approval_threshold_percent, can_approve_discounts, max_approvable_discount, description) VALUES
  -- Partner tiers
  ('partner', 'bronze', 5.00, 3.00, false, 0, 'Bronze partners: 5% max, approval needed above 3%'),
  ('partner', 'silver', 10.00, 5.00, false, 0, 'Silver partners: 10% max, approval needed above 5%'),
  ('partner', 'gold', 15.00, 10.00, false, 0, 'Gold partners: 15% max, approval needed above 10%'),
  ('partner', 'platinum', 20.00, 15.00, false, 0, 'Platinum partners: 20% max, approval needed above 15%'),
  -- Admin roles
  ('admin', 'sales_rep', 10.00, 5.00, false, 0, 'Sales reps: 10% max, approval needed above 5%'),
  ('admin', 'sales_manager', 20.00, 15.00, true, 15.00, 'Sales managers: 20% max, can approve up to 15%'),
  ('admin', 'director', 30.00, 25.00, true, 25.00, 'Directors: 30% max, can approve up to 25%'),
  ('admin', 'super_admin', 50.00, 50.00, true, 50.00, 'Super admins: 50% max, can approve any discount')
ON CONFLICT (role_type, role_name) DO NOTHING;

-- ============================================================================
-- TABLE 2: cpq_pricing_rules
-- Purpose: Conditional discount/markup rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS cpq_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('discount', 'markup', 'bundle', 'volume')),

  -- Rule conditions (JSONB for flexibility)
  -- Example: {"min_contract_term": 24, "min_sites": 3, "coverage_types": ["fibre", "5g"]}
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Rule effect
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount')),
  adjustment_value DECIMAL(10,2) NOT NULL, -- Positive for markup, negative for discount

  -- Applicability
  applies_to_product_ids UUID[], -- NULL means all products
  applies_to_partner_tiers TEXT[], -- e.g., ['gold', 'platinum']
  applies_to_customer_types TEXT[], -- e.g., ['business', 'enterprise']

  -- Stacking rules
  can_stack BOOLEAN DEFAULT true,
  stack_priority INTEGER DEFAULT 0, -- Higher = applied first

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed example pricing rules
INSERT INTO cpq_pricing_rules (name, description, rule_type, conditions, adjustment_type, adjustment_value, applies_to_partner_tiers, is_active) VALUES
  ('Multi-Site Discount', 'Automatic 5% discount for 3+ sites', 'volume', '{"min_sites": 3}', 'percentage', -5.00, NULL, true),
  ('Long-Term Contract', '10% discount for 36-month contracts', 'discount', '{"min_contract_term": 36}', 'percentage', -10.00, NULL, true),
  ('Fibre Bundle', '5% discount when bundling fibre with voice', 'bundle', '{"requires_services": ["fibre", "voice"]}', 'percentage', -5.00, NULL, true),
  ('Enterprise Volume', '15% discount for 10+ sites enterprise', 'volume', '{"min_sites": 10, "customer_type": "enterprise"}', 'percentage', -15.00, NULL, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TABLE 3: cpq_product_eligibility
-- Purpose: Product eligibility rules by coverage/tier/customer type
-- ============================================================================

CREATE TABLE IF NOT EXISTS cpq_product_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product reference
  product_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Eligibility conditions
  coverage_types TEXT[] NOT NULL DEFAULT ARRAY['fibre', '5g', 'lte', 'microwave'], -- Which coverage types can sell this
  partner_tiers TEXT[] DEFAULT NULL, -- NULL means all partners, or specific tiers
  customer_types TEXT[] DEFAULT ARRAY['residential', 'business', 'enterprise'],

  -- Geographic restrictions
  allowed_regions TEXT[], -- e.g., ['gauteng', 'western_cape'] or NULL for all
  excluded_regions TEXT[],

  -- Quantity limits
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 100,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One eligibility record per product
  UNIQUE(product_id)
);

-- ============================================================================
-- TABLE 4: cpq_sessions
-- Purpose: Wizard state persistence for multi-step configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS cpq_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session ownership
  owner_type TEXT NOT NULL CHECK (owner_type IN ('admin', 'partner')),
  owner_id UUID NOT NULL, -- References admin_users.id or partners.id

  -- Session state
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 7),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- In progress
    'pending_approval', -- Discount needs approval
    'approved',        -- Approved, ready to convert
    'converted',       -- Converted to quote
    'abandoned',       -- User abandoned
    'expired'          -- Session expired
  )),

  -- Step data (JSONB for each wizard step)
  step_data JSONB NOT NULL DEFAULT '{
    "needs_assessment": null,
    "locations": [],
    "selected_packages": [],
    "configuration": {},
    "pricing": {},
    "customer_details": {},
    "review": {}
  }'::jsonb,

  -- AI interactions
  ai_chat_history JSONB DEFAULT '[]'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,

  -- Discount tracking
  total_discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_approved BOOLEAN DEFAULT false,
  discount_approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  discount_approved_at TIMESTAMPTZ,

  -- Conversion tracking
  converted_quote_id UUID REFERENCES business_quotes(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================================================
-- TABLE 5: cpq_approval_requests
-- Purpose: Track discount approval workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS cpq_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session reference
  session_id UUID NOT NULL REFERENCES cpq_sessions(id) ON DELETE CASCADE,

  -- Request details
  requested_discount_percent DECIMAL(5,2) NOT NULL,
  justification TEXT,

  -- Requester info
  requester_type TEXT NOT NULL CHECK (requester_type IN ('admin', 'partner')),
  requester_id UUID NOT NULL,

  -- Approval chain
  assigned_approver_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'escalated'
  )),

  -- Response
  response_notes TEXT,
  responded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 6: cpq_analytics
-- Purpose: Track CPQ usage and conversion metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS cpq_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session reference
  session_id UUID NOT NULL REFERENCES cpq_sessions(id) ON DELETE CASCADE,

  -- Funnel tracking
  step_entered INTEGER NOT NULL,
  step_completed BOOLEAN DEFAULT false,
  time_on_step_seconds INTEGER,

  -- AI usage
  ai_interactions INTEGER DEFAULT 0,
  ai_recommendations_shown INTEGER DEFAULT 0,
  ai_recommendations_accepted INTEGER DEFAULT 0,

  -- Conversion metrics
  final_quote_value DECIMAL(12,2),
  final_discount_percent DECIMAL(5,2),
  approval_required BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Discount limits
CREATE INDEX IF NOT EXISTS idx_cpq_discount_limits_role ON cpq_discount_limits(role_type, role_name) WHERE is_active = true;

-- Pricing rules
CREATE INDEX IF NOT EXISTS idx_cpq_pricing_rules_active ON cpq_pricing_rules(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_cpq_pricing_rules_type ON cpq_pricing_rules(rule_type) WHERE is_active = true;

-- Product eligibility
CREATE INDEX IF NOT EXISTS idx_cpq_product_eligibility_product ON cpq_product_eligibility(product_id) WHERE is_active = true;

-- Sessions
CREATE INDEX IF NOT EXISTS idx_cpq_sessions_owner ON cpq_sessions(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_cpq_sessions_status ON cpq_sessions(status) WHERE status NOT IN ('converted', 'abandoned', 'expired');
CREATE INDEX IF NOT EXISTS idx_cpq_sessions_expires ON cpq_sessions(expires_at) WHERE status = 'draft';

-- Approval requests
CREATE INDEX IF NOT EXISTS idx_cpq_approval_requests_pending ON cpq_approval_requests(assigned_approver_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_cpq_approval_requests_session ON cpq_approval_requests(session_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_cpq_analytics_session ON cpq_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_cpq_analytics_created ON cpq_analytics(created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE cpq_discount_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpq_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpq_product_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpq_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpq_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpq_analytics ENABLE ROW LEVEL SECURITY;

-- Discount limits: Read-only for authenticated users
CREATE POLICY "cpq_discount_limits_read" ON cpq_discount_limits
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Pricing rules: Read-only for authenticated users
CREATE POLICY "cpq_pricing_rules_read" ON cpq_pricing_rules
  FOR SELECT TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Product eligibility: Read-only for authenticated users
CREATE POLICY "cpq_product_eligibility_read" ON cpq_product_eligibility
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Sessions: Owners can manage their sessions
CREATE POLICY "cpq_sessions_owner_all" ON cpq_sessions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Approval requests: Requesters and approvers can access
CREATE POLICY "cpq_approval_requests_access" ON cpq_approval_requests
  FOR ALL TO authenticated
  USING (requester_id = auth.uid() OR assigned_approver_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- Analytics: Session owners can read their analytics
CREATE POLICY "cpq_analytics_read" ON cpq_analytics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cpq_sessions
    WHERE cpq_sessions.id = cpq_analytics.session_id
    AND cpq_sessions.owner_id = auth.uid()
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_cpq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cpq_discount_limits_updated
  BEFORE UPDATE ON cpq_discount_limits
  FOR EACH ROW EXECUTE FUNCTION update_cpq_updated_at();

CREATE TRIGGER trg_cpq_pricing_rules_updated
  BEFORE UPDATE ON cpq_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_cpq_updated_at();

CREATE TRIGGER trg_cpq_product_eligibility_updated
  BEFORE UPDATE ON cpq_product_eligibility
  FOR EACH ROW EXECUTE FUNCTION update_cpq_updated_at();

CREATE TRIGGER trg_cpq_sessions_updated
  BEFORE UPDATE ON cpq_sessions
  FOR EACH ROW EXECUTE FUNCTION update_cpq_updated_at();

CREATE TRIGGER trg_cpq_approval_requests_updated
  BEFORE UPDATE ON cpq_approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_cpq_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cpq_discount_limits IS 'Role-based discount limits matrix for CPQ system';
COMMENT ON TABLE cpq_pricing_rules IS 'Conditional pricing rules (discounts, markups, bundles)';
COMMENT ON TABLE cpq_product_eligibility IS 'Product eligibility by coverage type, tier, and customer type';
COMMENT ON TABLE cpq_sessions IS 'CPQ wizard session state persistence';
COMMENT ON TABLE cpq_approval_requests IS 'Discount approval workflow tracking';
COMMENT ON TABLE cpq_analytics IS 'CPQ funnel and conversion analytics';
